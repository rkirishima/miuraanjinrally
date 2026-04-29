import { ImageResponse } from 'next/og'
import { readFileSync } from 'fs'
import { join } from 'path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function fetchJapaneseFont(): Promise<ArrayBuffer | null> {
  try {
    const text = 'GPS三浦按針ラリー二〇二六スタンプ葉山逗子'
    const cssUrl = `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&text=${encodeURIComponent(text)}`
    // Use old UA to get TTF (not woff2) — @vercel/og only supports TTF/OTF
    const css = await fetch(cssUrl, {
      headers: { 'User-Agent': 'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1)' },
    }).then((r) => r.text())
    const urls = Array.from(css.matchAll(/url\((https:\/\/fonts\.gstatic\.com[^)]+)\)/g)).map((m) => m[1])
    if (!urls.length) return null
    return await fetch(urls[0]).then((r) => r.arrayBuffer())
  } catch {
    return null
  }
}

export async function GET() {
  // Load compressed background image from disk
  const imgBuffer = readFileSync(join(process.cwd(), 'public/images/cover-og.jpg'))
  const imgSrc = `data:image/jpeg;base64,${imgBuffer.toString('base64')}`

  // Load Japanese font (subset — only chars we use)
  const fontData = await fetchJapaneseFont()

  const fontFamily = fontData ? 'NotoSansJP' : 'sans-serif'

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          position: 'relative',
          background: '#1a1815',
        }}
      >
        {/* Background photo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 30%',
          }}
        />

        {/* Dark gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(135deg, rgba(15,12,8,0.94) 0%, rgba(15,12,8,0.68) 50%, rgba(15,12,8,0.82) 100%)',
            display: 'flex',
          }}
        />

        {/* Left accent bar */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            background: 'linear-gradient(to bottom, #d68a52, rgba(214,138,82,0.2))',
          }}
        />

        {/* Content */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '52px 80px 52px 84px',
          }}
        >
          {/* ── Top row ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div
              style={{
                fontSize: 15,
                letterSpacing: '0.48em',
                color: 'rgba(244,236,219,0.52)',
                fontFamily,
              }}
            >
              GPS スタンプラリー
            </div>
            <div
              style={{
                fontSize: 13,
                color: 'rgba(244,236,219,0.32)',
                letterSpacing: '0.14em',
                fontFamily: 'monospace',
              }}
            >
              35.16°N · 139.62°E
            </div>
          </div>

          {/* ── Main title ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div
              style={{
                fontSize: 108,
                fontWeight: 700,
                color: '#f4ecdb',
                lineHeight: 1.0,
                letterSpacing: '0.04em',
                fontFamily,
              }}
            >
              三浦按針
            </div>
            <div
              style={{
                fontSize: 108,
                fontWeight: 700,
                color: '#f4ecdb',
                lineHeight: 1.0,
                letterSpacing: '0.04em',
                fontFamily,
              }}
            >
              ラリー
            </div>

            {/* Subtitle row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                marginTop: 22,
              }}
            >
              <span
                style={{
                  fontSize: 24,
                  color: 'rgba(244,236,219,0.65)',
                  fontStyle: 'italic',
                  letterSpacing: '0.04em',
                }}
              >
                The Miura Anjin Rally
              </span>
              <span style={{ fontSize: 24, color: 'rgba(244,236,219,0.3)' }}>·</span>
              <span
                style={{
                  fontSize: 24,
                  color: 'rgba(244,236,219,0.65)',
                  fontFamily,
                }}
              >
                二〇二六
              </span>
            </div>
          </div>

          {/* ── Bottom row ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div
                style={{
                  fontSize: 19,
                  color: 'rgba(244,236,219,0.58)',
                  letterSpacing: '0.2em',
                  fontFamily,
                }}
              >
                June 20–21, 2026  ·  三浦半島
              </div>
              <div
                style={{
                  fontSize: 15,
                  color: 'rgba(244,236,219,0.32)',
                  letterSpacing: '0.16em',
                }}
              >
                FELICITY × ROYAL ENFIELD
              </div>
            </div>
            <div
              style={{
                fontSize: 14,
                color: 'rgba(244,236,219,0.28)',
                letterSpacing: '0.2em',
              }}
            >
              anjinrally.com
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: fontData
        ? [
            {
              name: 'NotoSansJP',
              data: fontData,
              style: 'normal',
              weight: 700,
            },
          ]
        : [],
    }
  )
}
