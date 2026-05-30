# Landing Feature

Public-facing landing page for Habiba Nabil Arabic Academy.

## Structure

```
landing/
├── types.ts                        — Testimonial, PricingPlan, Article, Video
├── api.ts                          — GET /api/public/{testimonials,pricing,articles,videos}
├── LandingPage.tsx                 — Root component; fetches testimonials + pricing
├── README.md                       — This file
└── components/
    ├── HeroSection.tsx             — Full-width hero with teacher photo + 2 CTAs
    ├── StatsBar.tsx                — Animated count-up stats (students, lessons, rating, years)
    ├── FeaturesGrid.tsx            — 3-column feature highlights with Lucide icons
    ├── HowItWorks.tsx              — 3-step process with decorative connector line
    ├── TestimonialsSection.tsx     — Drag-to-scroll horizontal testimonial carousel
    ├── PricingSection.tsx          — Pricing plan cards; popular plan highlighted in accent
    └── TeacherBio.tsx              — Teacher photo + credentials + trust signals
```

## Data flow

`LandingPage` fetches testimonials and pricing via TanStack Query. All other sections
are static (no API calls). Sections that need data receive it as props.

## Animations

- Hero: `stagger` + `fadeInUp` on text, scale-in on photo
- Stats: count-up on viewport enter via `useInView`
- Features: `staggerChildren` + `cardVariant` + hover lift
- Steps: `staggerChildren` + `fadeInUp` per step
- Testimonials: Framer Motion `drag="x"` carousel
- Pricing: `cardVariant` + hover lift; popular card in accent color
- Teacher bio: `fadeInLeft` for photo, `fadeInRight` for text

## API endpoints expected

- `GET /api/public/testimonials` → `{ ok: true, items: Testimonial[] }`
- `GET /api/public/pricing`      → `{ ok: true, items: PricingPlan[] }`
- `GET /api/public/articles`     → `{ ok: true, items: Article[] }`
- `GET /api/public/videos`       → `{ ok: true, items: Video[] }`
