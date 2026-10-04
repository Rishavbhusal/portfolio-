import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * SEO plumbing driven by VITE_SITE_URL (e.g. https://example.com.np).
 * The production hostname is intentionally NOT hard-coded: when the variable is
 * unset, canonical / og:url / sitemap are omitted instead of guessing a domain.
 */
function seo(siteUrl: string): Plugin {
  const base = siteUrl.replace(/\/+$/, '')
  return {
    name: 'portfolio-seo',
    transformIndexHtml(html) {
      return html.replace(/<!--url-->([\s\S]*?)<!--\/url-->/g, (_m, inner: string) =>
        base ? inner.replaceAll('%SITE_URL%', base) : '',
      )
    },
    generateBundle() {
      const robots = ['User-agent: *', 'Allow: /', base ? `Sitemap: ${base}/sitemap.xml` : ''].filter(Boolean).join('\n') + '\n'
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots })
      if (base) {
        this.emitFile({
          type: 'asset',
          fileName: 'sitemap.xml',
          source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${base}/</loc><lastmod>${new Date().toISOString().slice(0, 10)}</lastmod><changefreq>monthly</changefreq><priority>1.0</priority></url>\n</urlset>\n`,
        })
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  return {
    plugins: [react(), seo(env.VITE_SITE_URL || 'https://rishavbhusal.com.np')],
    build: {
      target: 'es2022',
    },
  }
})
