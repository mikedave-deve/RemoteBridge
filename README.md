# RemoteBridge — website

React 19 + Vite + Tailwind CSS 3, with GSAP (ScrollTrigger, SplitText, MotionPath) and Lenis smooth scrolling.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve the production build
```

Requires Node 18 or newer.

## Pages

| Route | File |
|---|---|
| `/` Home | `src/pages/Home.jsx` (sections in `src/components/home/`) |
| `/jobs` Browse jobs (search, filters, sort) | `src/pages/Jobs.jsx` |
| `/jobs/:id` Job detail | `src/pages/JobDetail.jsx` |
| `/submit-resume` Three-step résumé form with drag-and-drop upload | `src/pages/SubmitResume.jsx` |
| `/about` Company, services, history, contact form | `src/pages/About.jsx` |
| `/team` Leadership and team | `src/pages/Team.jsx` |
| `/login`, `/create-account` | `src/pages/Auth.jsx` |

## Brand

- **Logo**: `src/components/Logo.jsx` (React), `public/logo.svg` and `public/favicon.svg`. The mark is a stone arch held together by a keystone.
- **Colour**: brand teal `#1F7A8C` with a full scale (`bridge-50` to `bridge-950`) in `tailwind.config.js`; deep harbour `#0B3640` for dark sections; brass `#C8A464` as a sparing accent.
- **Type**: Newsreader (display) and Hanken Grotesk (text), self-hosted through `@fontsource`.

## Motion

- `src/lib/SmoothScroll.jsx` connects Lenis to GSAP's ticker and ScrollTrigger.
- `src/components/Transition.jsx` is the page curtain (with the keystone intro on first load).
- `src/lib/useReveal.js` gives any section scroll reveals through data attributes: `data-split`, `data-fade`, `data-stagger`, `data-count`, `data-draw`.
- Every animation is wrapped in `gsap.matchMedia()` and respects `prefers-reduced-motion`.

## Content and data

Jobs, team and articles live in `src/data/`. Companies, people and figures are placeholder content for design purposes; replace them before launch. Team portraits load from Unsplash and fall back to branded monograms if an image fails.

Forms are front-end only (validation and success states included). Connect them to your API or a form service before going live.

## Deploying

Any static host works. Because routes use the browser history API, configure the host to serve `index.html` for unknown paths (Netlify: `_redirects` with `/* /index.html 200`; Vercel does this automatically for Vite).
