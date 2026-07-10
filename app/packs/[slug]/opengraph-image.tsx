import { ImageResponse } from 'next/og'
import { getPackBySlug } from '@/src/lib/services/share.service'

export const alt = 'AI Stickies Pack'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OGImage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const pack = await getPackBySlug(slug)

  if (!pack) {
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            backgroundColor: '#000',
            color: '#fff',
            fontSize: 48,
          }}
        >
          Pack Not Found
        </div>
      ),
      { ...size }
    )
  }

  const thumbnails = pack.stickers.slice(0, 4)

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          backgroundColor: '#fafafa',
          padding: 60,
          gap: 32,
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 48,
            fontWeight: 700,
            color: '#111',
            textAlign: 'center',
          }}
        >
          {pack.style_name}
        </div>

        <div
          style={{
            display: 'flex',
            gap: 16,
          }}
        >
          {thumbnails.map((sticker, i) => (
            <img
              key={i}
              src={sticker.imageUrl}
              alt=""
              width={200}
              height={200}
              style={{
                borderRadius: 16,
                objectFit: 'cover',
                border: '2px solid #e5e5e5',
              }}
            />
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: 20,
            color: '#888',
          }}
        >
          {pack.stickers.length} stickers &middot; Made with AI Stickies
        </div>
      </div>
    ),
    { ...size }
  )
}
