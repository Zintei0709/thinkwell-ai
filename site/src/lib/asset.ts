// Resolve a file from public/ against Vite's base URL, so the site works both
// at a domain root and under a sub-path such as GitHub Pages' /<repo>/.
export const asset = (path: string): string =>
  import.meta.env.BASE_URL + path.replace(/^\/+/, '')
