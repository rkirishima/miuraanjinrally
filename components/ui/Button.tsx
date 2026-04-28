import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  fullWidth?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-rally-blue-dark text-white hover:bg-rally-blue-dark/90 shadow-rally active:scale-[0.98]',
  secondary:
    'bg-rally-gray-dark text-rally-beige hover:bg-rally-gray-dark/90 shadow-rally active:scale-[0.98]',
  outline:
    'bg-transparent border-2 border-rally-blue-dark text-rally-blue-dark hover:bg-rally-blue-light active:scale-[0.98]',
  ghost:
    'bg-transparent text-rally-gray-dark hover:bg-rally-beige-dark/30 active:scale-[0.98]',
  danger:
    'bg-red-500 text-white hover:bg-red-600 shadow-rally active:scale-[0.98]',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-xs font-bold tracking-wide rounded-rally',
  md: 'px-6 py-3 text-sm font-bold tracking-wide rounded-rally',
  lg: 'px-8 py-4 text-base font-bold tracking-wide rounded-rally',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center gap-2 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-rally-blue-dark focus-visible:ring-offset-2',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          (disabled || isLoading) && 'opacity-50 pointer-events-none',
          className
        )}
        {...props}
      >
        {isLoading && (
          <span
            className={cn(
              'border-2 rounded-full animate-spin flex-shrink-0',
              size === 'sm' ? 'w-3 h-3' : 'w-4 h-4',
              variant === 'primary' || variant === 'secondary' || variant === 'danger'
                ? 'border-white/30 border-t-white'
                : 'border-rally-blue-dark/30 border-t-rally-blue-dark'
            )}
          />
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
