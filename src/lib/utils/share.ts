const BASE_URL = 'https://aistickies.com'

export function getShareUrl(slug: string): string {
  return `${BASE_URL}/packs/${slug}`
}

export function getTwitterShareUrl(url: string, text: string): string {
  const params = new URLSearchParams({ url, text })
  return `https://twitter.com/intent/tweet?${params.toString()}`
}

export function getLineShareUrl(url: string): string {
  const params = new URLSearchParams({ url })
  return `https://social-plugins.line.me/lineit/share?${params.toString()}`
}

export function getWhatsAppShareUrl(url: string, text: string): string {
  const fullText = `${text} ${url}`
  const params = new URLSearchParams({ text: fullText })
  return `https://wa.me/?${params.toString()}`
}
