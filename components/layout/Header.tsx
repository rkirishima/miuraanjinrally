'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, Compass, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export interface HeaderProps {
  title?: string
  showBack?: boolean
  backHref?: string
  riderNumber?: string
  riderName?: string
  variant?: 'default' | 'dark' | 'transparent'
  className?: string
}

export function Header({
  title,
  showBack = false,
  backHref = '/dashboard',
  riderNumber,
  riderName,
  variant = 'default',
  className,
}: HeaderProps) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  const isAdmin = pathname?.startsWith('/admin')

  const containerClasses = cn(
    'px-4 py-3 flex items-center gap-3',
    variant === 'dark' && 'bg-rally-gray-dark text-rally-beige-light',
    variant === 'default' && 'bg-rally-beige-light border-b border-rally-beige-dark/40',
    variant === 'transparent' && 'bg-transparent absolute top-0 left-0 right-0 z-20',
    className
  )

  return (
    <>
      <header className={containerClasses}>
        {/* Back button or Logo */}
        {showBack ? (
          <Link
            href={backHref}
            className={cn(
              'w-9 h-9 rounded-rally flex items-center justify-center transition-colors flex-shrink-0',
              variant === 'dark'
                ? 'bg-white/10 text-rally-beige hover:bg-white/20'
                : 'bg-rally-beige-dark/30 text-rally-gray-dark hover:bg-rally-beige-dark/50'
            )}
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
        ) : (
          <Link href={riderNumber ? '/dashboard' : '/'} className="flex items-center gap-2 flex-shrink-0">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center',
                variant === 'dark' ? 'bg-rally-blue-dark/30' : 'bg-rally-blue-dark/10'
              )}
            >
              <Compass
                className={cn(
                  'w-4 h-4',
                  variant === 'dark' ? 'text-rally-blue' : 'text-rally-blue-dark'
                )}
              />
            </div>
          </Link>
        )}

        {/* Title / Event name */}
        <div className="flex-1 min-w-0">
          {title ? (
            <h1
              className={cn(
                'font-black text-sm truncate',
                variant === 'dark' ? 'text-rally-beige-light' : 'text-rally-gray-dark'
              )}
            >
              {title}
            </h1>
          ) : (
            <div>
              <p
                className={cn(
                  'font-black text-sm leading-none',
                  variant === 'dark' ? 'text-rally-beige-light' : 'text-rally-gray-dark'
                )}
              >
                ANJIN RALLY
              </p>
              <p
                className={cn(
                  'text-xs font-medium leading-none mt-0.5',
                  variant === 'dark' ? 'text-rally-gray' : 'text-rally-gray'
                )}
              >
                {isAdmin ? 'ADMIN' : '2026'}
              </p>
            </div>
          )}
        </div>

        {/* Rider info or menu */}
        {riderNumber && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="text-right">
              <p
                className={cn(
                  'text-xs font-bold',
                  variant === 'dark' ? 'text-rally-beige-light' : 'text-rally-gray-dark'
                )}
              >
                #{riderNumber}
              </p>
              {riderName && (
                <p className="text-xs text-rally-gray truncate max-w-[80px]">{riderName}</p>
              )}
            </div>
          </div>
        )}

        {!riderNumber && !showBack && (
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={cn(
              'w-9 h-9 rounded-rally flex items-center justify-center transition-colors flex-shrink-0',
              variant === 'dark'
                ? 'bg-white/10 text-rally-beige hover:bg-white/20'
                : 'bg-rally-beige-dark/30 text-rally-gray-dark hover:bg-rally-beige-dark/50'
            )}
          >
            {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        )}
      </header>

      {/* Mobile navigation menu */}
      {menuOpen && (
        <div
          className={cn(
            'absolute top-14 left-0 right-0 z-30 border-b shadow-rally-lg',
            variant === 'dark'
              ? 'bg-rally-gray-dark border-white/10'
              : 'bg-rally-beige-light border-rally-beige-dark/40'
          )}
        >
          <nav className="px-4 py-3 space-y-1">
            {[
              { href: '/', label: 'ホーム' },
              { href: '/login', label: 'ログイン' },
              { href: '/register', label: '参加登録' },
              { href: '/dashboard', label: 'ダッシュボード' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  'block px-3 py-2.5 rounded-rally text-sm font-medium transition-colors',
                  pathname === href
                    ? variant === 'dark'
                      ? 'bg-rally-blue-dark/20 text-rally-blue'
                      : 'bg-rally-blue-light text-rally-blue-dark'
                    : variant === 'dark'
                    ? 'text-rally-beige hover:bg-white/10'
                    : 'text-rally-gray-dark hover:bg-rally-beige-dark/30'
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  )
}
