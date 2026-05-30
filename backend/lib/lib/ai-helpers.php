<?php
// lib/ai-helpers.php — Shared AI helper functions
declare(strict_types=1);

/**
 * Collect all relevant student data for AI context
 */
function get_student_context(PDO $pdo, int $studentId): array
{
    // Student profile
    $stmt = $pdo->prepare("SELECT full_name, level, age, country FROM students WHERE id = ?");
    $stmt->execute([$studentId]);
    $student = $stmt->fetch() ?: [];

    // Contract
    $stmt = $pdo->prepare("SELECT total_hours, session_duration_minutes, start_date, notes FROM student_contracts WHERE student_id = ?");
    $stmt->execute([$studentId]);
    $contract = $stmt->fetch() ?: null;

    $totalSessions = 0;
    if ($contract) {
        $totalSessions = (int)round((float)$contract['total_hours'] / ((int)$contract['session_duration_minutes'] / 60));
    }

    // Sessions (all)
    $stmt = $pdo->prepare("
        SELECT session_number, title, status, skills, goals, teacher_notes, actual_date, planned_date
        FROM lesson_plan_sessions
        WHERE student_id = ?
        ORDER BY session_number ASC
    ");
    $stmt->execute([$studentId]);
    $sessions = $stmt->fetchAll();

    // Recent homework submissions (last 10)
    $stmt = $pdo->prepare("
        SELECT h.title AS hw_title, hs.mcq_score, hs.mcq_total, hs.submitted_at, hs.teacher_note
        FROM homework_submissions hs
        JOIN homeworks h ON h.id = hs.homework_id
        WHERE hs.student_id = ? AND hs.is_submitted = 1
        ORDER BY hs.submitted_at DESC
        LIMIT 10
    ");
    $stmt->execute([$studentId]);
    $submissions = $stmt->fetchAll();

    // Recent scenario recordings (last 10)
    $stmt = $pdo->prepare("
        SELECT sc.title AS sc_title,
               COUNT(sr.id) AS take_count,
               MAX(sr.submitted_at) AS last_date,
               MAX(sr.teacher_note) AS teacher_note
        FROM scenario_recordings sr
        JOIN scenarios sc ON sc.id = sr.scenario_id
        WHERE sr.student_id = ?
        GROUP BY sc.id, sc.title
        ORDER BY last_date DESC
        LIMIT 10
    ");
    $stmt->execute([$studentId]);
    $recordings = $stmt->fetchAll();

    // Active weak words
    $stmt = $pdo->prepare("SELECT word FROM student_weak_words WHERE student_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 20");
    $stmt->execute([$studentId]);
    $weakWords = array_column($stmt->fetchAll(), 'word');

    // Active tracked mistakes
    $stmt = $pdo->prepare("SELECT tag FROM student_common_mistakes WHERE student_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 20");
    $stmt->execute([$studentId]);
    $mistakes = array_column($stmt->fetchAll(), 'tag');

    return [
        'student'     => $student,
        'contract'    => $contract ? array_merge($contract, ['total_sessions' => $totalSessions]) : null,
        'sessions'    => $sessions,
        'submissions' => $submissions,
        'recordings'  => $recordings,
        'weak_words'  => $weakWords,
        'mistakes'    => $mistakes,
    ];
}

/**
 * Call Claude API and return the parsed JSON response
 * Throws RuntimeException on any failure
 */
function claude_chat(string $system, string $user, int $maxTokens = 2000): array
{
    $apiKey = getenv('ANTHROPIC_API_KEY');
    if (!$apiKey) {
        throw new RuntimeException('NO_API_KEY');
    }

    $payload = json_encode([
        'model'      => 'claude-haiku-4-5-20251001',
        'max_tokens' => $maxTokens,
        'system'     => $system,
        'messages'   => [
            ['role' => 'user', 'content' => $user]
        ],
    ]);

    $ch = curl_init('https://api.anthropic.com/v1/messages');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 60,
        CURLOPT_HTTPHEADER     => [
            'x-api-key: '         . $apiKey,
            'anthropic-version: 2023-06-01',
            'content-type: application/json',
        ],
    ]);

    $raw    = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err    = curl_error($ch);
    curl_close($ch);

    if ($err) {
        throw new RuntimeException('CURL_ERROR: ' . $err);
    }

    $body = json_decode($raw, true);

    if ($status !== 200 || !isset($body['content'][0]['text'])) {
        $msg = $body['error']['message'] ?? 'API error (HTTP ' . $status . ')';
        throw new RuntimeException('API_ERROR: ' . $msg);
    }

    $text   = strip_json_fences($body['content'][0]['text']);
    $result = json_decode($text, true);

    if (!is_array($result)) {
        throw new RuntimeException('INVALID_JSON: ' . substr($text, 0, 200));
    }

    return $result;
}

/**
 * Strip markdown code fences from AI responses
 */
function strip_json_fences(string $text): string
{
    $text = trim($text);
    // Remove ```json ... ``` or ``` ... ```
    if (preg_match('/^```(?:json)?\s*([\s\S]*?)```\s*$/s', $text, $m)) {
        return trim($m[1]);
    }
    return $text;
}

/**
 * Level descriptions for Arabic teaching context
 */
function get_level_description(string $level): string
{
    $map = [
        'A1' => 'مبتدئ كامل — absolute beginner, learning first Arabic words and phrases',
        'A2' => 'مبتدئ — beginner, knows basic phrases and simple daily expressions',
        'B1' => 'متوسط — intermediate, can handle familiar topics and simple conversations',
        'B2' => 'فوق المتوسط — upper-intermediate, wider range of topics with more fluency',
        'C1' => 'متقدم — advanced, can discuss complex topics with near-fluency',
        'C2' => 'إتقان — mastery level, near-native command of Arabic',
    ];
    return $map[$level] ?? $level;
}

/**
 * Build compact student context text for AI prompts
 */
function build_context_text(array $ctx): string
{
    $s  = $ctx['student'];
    $c  = $ctx['contract'];
    $level = $s['level'] ?? 'Unknown';
    $levelDesc = get_level_description($level);

    $text  = "Student: {$s['full_name']}, Level: {$level} ({$levelDesc}), Age: " . ($s['age'] ?? 'unknown') . ", Country: " . ($s['country'] ?? 'unknown') . "\n\n";

    if ($c) {
        $done      = count(array_filter($ctx['sessions'], fn($x) => $x['status'] === 'completed'));
        $total     = $c['total_sessions'];
        $remaining = max(0, $total - $done);
        $text .= "Contract: {$c['total_hours']}h total, {$c['session_duration_minutes']}min/session, started {$c['start_date']}\n";
        $text .= "Sessions: {$done} completed of {$total} total ({$remaining} remaining)\n\n";
    }

    if ($ctx['sessions']) {
        $completed = array_filter($ctx['sessions'], fn($x) => $x['status'] === 'completed');
        if ($completed) {
            $text .= "Completed sessions:\n";
            foreach ($completed as $sess) {
                $skills = $sess['skills'] ?: 'general';
                $notes  = $sess['teacher_notes'] ? " | Note: {$sess['teacher_notes']}" : '';
                $text  .= "  • #{$sess['session_number']}: {$sess['title']} [{$skills}]{$notes}\n";
            }
            $text .= "\n";
        }
    }

    if ($ctx['submissions']) {
        $text .= "Recent homework performance:\n";
        foreach ($ctx['submissions'] as $sub) {
            $score = ($sub['mcq_total'] > 0)
                ? " Score: {$sub['mcq_score']}/{$sub['mcq_total']}"
                : ' (no MCQ)';
            $note  = $sub['teacher_note'] ? " | Feedback: {$sub['teacher_note']}" : '';
            $text .= "  • {$sub['hw_title']}{$score}{$note}\n";
        }
        $text .= "\n";
    }

    if ($ctx['recordings']) {
        $text .= "Recent scenario recordings:\n";
        foreach ($ctx['recordings'] as $rec) {
            $note  = $rec['teacher_note'] ? " | Feedback: {$rec['teacher_note']}" : '';
            $text .= "  • {$rec['sc_title']} ({$rec['take_count']} takes){$note}\n";
        }
        $text .= "\n";
    }

    if ($ctx['weak_words']) {
        $text .= "Weak vocabulary: " . implode(', ', $ctx['weak_words']) . "\n\n";
    }

    if ($ctx['mistakes']) {
        $text .= "Tracked mistakes: " . implode(', ', $ctx['mistakes']) . "\n\n";
    }

    return $text;
}
