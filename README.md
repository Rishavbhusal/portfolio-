# Rishav Bhusal — Portfolio

React + TypeScript + Vite, with one persistent Three.js / React Three Fiber world behind semantic HTML.
Anime.js choreographs typography and UI; StringTune provides smooth scroll, parallax and magnetic buttons.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build -> dist/
npm run preview
```

## Content is data

All facts come from the CV (`cv/`) and live in `src/data/`:

| File | Contents |
| --- | --- |
| `site.ts` | name, role, email, LinkedIn, education |
| `projects.ts` | the four projects (stack, details, achievement, optional `github` / `demo`) |
| `skills.ts` | grouped skills and which project shipped them |
| `achievements.ts` | verified achievements |

Nothing is invented: if a field is missing it is simply not rendered.

## Things the CV did not contain (left configurable, not guessed)

Copy `.env.example` to `.env` and fill in when verified:

- `VITE_SITE_URL` — the `.com.np` hostname (e.g. `https://yourname.com.np`). When set, the build emits
  canonical / `og:url` / `og:image`, `sitemap.xml` and a `Sitemap:` line in `robots.txt`.
- `VITE_GITHUB_URL` — shows GitHub buttons in the hero, contact section and project index.
- Per-project `github` / `demo` URLs in `src/data/projects.ts` — show CODE / LIVE buttons only when present.

## Architecture

- `src/lib/store.ts` — mutable frame state (scroll, pointer, section weights). No React state per frame.
- `src/lib/scrollDriver.ts` — maps scroll to formation A→B, project progress and the contact shutdown.
- `src/webgl/` — one canvas: `formations.ts` (procedural node layouts), `Network.tsx` (nodes, edges, packets,
  lead packet; custom GLSL in `shaders.ts`), `Gate.tsx` (TapGuard verification), `cameraRig.ts`.
- `src/animation/` — StringTune setup and Anime.js reveals.
- WebGL is progressive enhancement: lazy-loaded, error-bounded, and the site is fully usable without it.
  `prefers-reduced-motion` disables smooth scroll, camera travel, scatter and most packets.
