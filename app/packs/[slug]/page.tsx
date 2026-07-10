import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { after } from 'next/server'
import { getPackBySlug, incrementViewCount } from '@/src/lib/services/share.service'
import { getShareUrl } from '@/src/lib/utils/share'
import { PublicPackView } from './public-pack-view'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const pack = await getPackBySlug(slug)

  if (!pack) {
    return { title: 'Pack Not Found' }
  }

  const title = `${pack.style_name} Sticker Pack`
  const description = `Check out this ${pack.style_name} sticker pack with ${pack.stickers.length} stickers, made with AI Stickies.`
  const shareUrl = getShareUrl(slug)

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: shareUrl,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function PublicPackPage({ params }: PageProps) {
  const { slug } = await params
  const pack = await getPackBySlug(slug)

  if (!pack) {
    notFound()
  }

  after(async () => {
    await incrementViewCount(pack.id)
  })

  return (
    <div className="min-h-dvh bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
                <svg
                  className="size-5 text-primary-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <span className="font-bold text-lg text-foreground tracking-tight">AI Stickies</span>
            </Link>
            <Link
              href="/create"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 py-2 rounded-full text-sm transition-transform active:scale-95"
            >
              Make Your Own
            </Link>
          </nav>
        </div>
      </header>

      <main id="main-content" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2 text-balance">
            {pack.style_name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {pack.stickers.length} stickers &middot; {pack.view_count.toLocaleString()} views
          </p>
        </div>

        <PublicPackView pack={pack} slug={slug} />
      </main>
    </div>
  )
}
