# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Static export to ./out (used by GitHub Pages CI)
npm run lint     # Run ESLint
```

No test suite is configured.

## Architecture

Single-page React app (`app/page.tsx`) — the entire simulator lives in one `"use client"` component with no routing. All financial logic is in a single `useMemo` block that recomputes on every input change.

**Key data flow:**
1. User adjusts inputs via `useState` → `inputs` object
2. `simulationData` (useMemo) derives: incidental cost breakdown, total cash at purchase date, month-by-month cash/credit-loan/mortgage balances
3. Recharts `AreaChart` renders the time series; toggle buttons on the chart control `visibleKeys` state

**Financial model details (important for correctness):**
- All monetary values are stored in **만원 (10,000 KRW)** units throughout; `formatKRW` multiplies by 10,000 before formatting
- Simulation starts at month 0 (잔금일, settlement date) and runs until 12 months after the credit loan is fully repaid, or 360 months max
- Acquisition tax rate is tiered: ≤6억 → 1.1%, 6~9억 → 2.2%, >9억 → 3.3%
- Broker fee is tiered by price band (0.5% / 0.6% / 0.7%) with 10% VAT added
- Legal/bond discount fee is fixed at 0.2% of purchase price
- Credit loan is repaid first from net monthly income (salary − living expense − mortgage payment); surplus goes to cash

**UI components:** shadcn/ui (`Card`, `Input`, `Label`) live under `components/ui/`. Styling uses Tailwind CSS v4 with `tw-animate-css`. The `cn()` utility in `lib/utils.ts` merges class names.

## Deployment

Deployed as a static site to GitHub Pages at https://yangcoding1.github.io/buy-house/

- `next.config.ts` sets `output: "export"` and `basePath: "/buy-house"`
- GitHub Actions (`.github/workflows/nextjs.yml`) builds on every push to `main` and deploys `./out` to Pages
- Images are unoptimized (`images.unoptimized: true`) because static export doesn't support the Next.js Image Optimization API
