import type { Metadata } from 'next'
import Link from 'next/link'
import { Eye } from 'lucide-react'
import { getPublicPacks } from '@/src/lib/services/gallery.service'
import { Header } from '@/app/components/layout/header'

export const metadata: Metadata = {
  title: 'Gallery',
  description: 'Browse sticker packs created by the AI Stickies community.',
  openGraph: {
    title: 'Gallery | AI Stickies',
    description: 'Browse sticker packs created by the AI Stickies community.',
  },
}

interface GalleryPageProps {
  searchParams: Promise<{ page?: string }>
}

const PACKS_PER_PAGE = 12

export default async function GalleryPage({ searchParams }: GalleryPageProps) {
  const resolvedParams = await searchParams
  const page = Math.max(1, parseInt(resolvedParams.page ?? '1', 10) || 1)
  const { packs, total } = await getPublicPacks({ page, limit: PACKS_PER_PAGE })
  const totalPages = Math.ceil(total / PACKS_PER_PAGE)

  return (
    <div className="min-h-dvh bg-background">
      <Header />

      <main id="main-content" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">
            Gallery
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Browse sticker packs created by the community
          </p>
        </div>

        {packs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">No public packs yet. Be the first to share one!</p>
            <Link
              href="/create"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-2.5 rounded-full text-sm inline-block transition-transform active:scale-95"
            >
              Create Stickers
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {packs.map((pack) => (
                <Link
                  key={pack.id}
                  href={`/packs/${pack.shareSlug}`}
                  className="group block rounded-xl border border-border bg-card overflow-hidden hover:border-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <div className="grid grid-cols-2 gap-1 p-2">
                    {pack.thumbnails.map((url, i) => (
                      <div key={i} className="aspect-square rounded-lg overflow-hidden bg-secondary">
                        <img
                          src={url}
                          alt=""
                          width={185}
                          height={160}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ))}
                    {/* Fill empty slots if fewer than 4 thumbnails */}
                    {Array.from({ length: Math.max(0, 4 - pack.thumbnails.length) }).map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square rounded-lg bg-muted" />
                    ))}
                  </div>
                  <div className="px-3 pb-3 pt-1">
                    <h2 className="font-semibold text-foreground text-sm truncate group-hover:text-primary transition-colors">
                      {pack.styleName}
                    </h2>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <Eye className="size-3" />
                      <span>{pack.viewCount.toLocaleString()}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                {page > 1 && (
                  <Link
                    href={`/gallery?page=${page - 1}`}
                    className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-secondary transition-colors"
                  >
                    Previous
                  </Link>
                )}
                <span className="text-sm text-muted-foreground px-2">
                  Page {page} of {totalPages}
                </span>
                {page < totalPages && (
                  <Link
                    href={`/gallery?page=${page + 1}`}
                    className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-secondary transition-colors"
                  >
                    Next
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
