import { useState, useCallback } from 'react'
import type { FC } from 'react'
import { motion } from 'framer-motion'
import { HelpCircle } from 'lucide-react'
import { stagger, fadeInUp } from '@/design-system/animations'
import { Spinner } from '@/design-system/components'
import { useHelpCategories, useHelpArticles } from './useHelpCenter'
import { HelpSearch } from './components/HelpSearch'
import { HelpCategories } from './components/HelpCategories'
import { HelpAccordion } from './components/HelpAccordion'
import { HelpArticleView } from './components/HelpArticleView'
import type { HelpArticle } from './types'

export interface HelpCenterProps {
  role: string
  title?: string
  subtitle?: string
}

export const HelpCenter: FC<HelpCenterProps> = ({
  role,
  title = 'مركز المساعدة',
  subtitle = 'ابحث عن إجابات لأسئلتك الشائعة',
}) => {
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>()
  const [activeSlug, setActiveSlug] = useState<string | undefined>()

  const { data: categories = [], isLoading: loadingCats } = useHelpCategories(role)
  const { data: results, isLoading: loadingArticles } = useHelpArticles(role, {
    query,
    category: selectedCategory,
  })

  const articles = results?.articles ?? []

  const handleSearch = useCallback((value: string) => {
    setQuery(value)
    setSelectedCategory(undefined)
    setActiveSlug(undefined)
  }, [])

  const handleCategorySelect = useCallback((slug: string | undefined) => {
    setSelectedCategory(slug)
    setQuery('')
    setActiveSlug(undefined)
  }, [])

  const handleReadMore = useCallback((article: HelpArticle) => {
    setActiveSlug(article.slug)
  }, [])

  const handleBack = useCallback(() => {
    setActiveSlug(undefined)
  }, [])

  if (activeSlug) {
    return (
      <div className="mx-auto max-w-2xl px-4">
        <HelpArticleView slug={activeSlug} onBack={handleBack} />
      </div>
    )
  }

  const grouped = articles.reduce<Record<string, HelpArticle[]>>((acc, a) => {
    if (!acc[a.category]) acc[a.category] = []
    acc[a.category]!.push(a)
    return acc
  }, {})

  return (
    <div className="mx-auto max-w-3xl px-4">
      <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-8">

        <motion.div variants={fadeInUp} className="text-center">
          <HelpCircle size={40} className="mx-auto mb-3" style={{ color: 'var(--accent)' }} />
          <h2 className="mb-1 text-2xl font-bold" style={{ color: 'var(--ink)' }}>{title}</h2>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>{subtitle}</p>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <HelpSearch onSearch={handleSearch} />
        </motion.div>

        {!query && (
          <motion.div variants={fadeInUp}>
            {loadingCats ? (
              <div className="flex h-24 items-center justify-center">
                <Spinner />
              </div>
            ) : (
              <HelpCategories
                categories={categories}
                selected={selectedCategory}
                onSelect={handleCategorySelect}
              />
            )}
          </motion.div>
        )}

        <motion.div variants={fadeInUp}>
          {loadingArticles ? (
            <div className="flex h-32 items-center justify-center">
              <Spinner />
            </div>
          ) : articles.length === 0 ? (
            <p className="text-center text-sm" style={{ color: 'var(--muted)' }}>
              {query ? `لا توجد نتائج لـ "${query}"` : 'لا توجد مقالات في هذا القسم'}
            </p>
          ) : query || selectedCategory ? (
            <HelpAccordion articles={articles} onReadMore={handleReadMore} />
          ) : (
            <div className="flex flex-col gap-8">
              {Object.entries(grouped).map(([category, items]) => (
                <section key={category}>
                  <h3
                    className="mb-4 text-xs font-semibold uppercase tracking-widest"
                    style={{ color: 'var(--accent)' }}
                  >
                    {category}
                  </h3>
                  <HelpAccordion articles={items} onReadMore={handleReadMore} />
                </section>
              ))}
            </div>
          )}
        </motion.div>

      </motion.div>
    </div>
  )
}
