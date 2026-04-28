import { type HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'flat' | 'dark' | 'blue' | 'green'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  interactive?: boolean
}

const variantClasses = {
  default: 'bg-rally-beige-light border border-rally-beige-dark/30',
  elevated: 'bg-white border border-rally-beige-dark/20 shadow-rally',
  flat: 'bg-rally-beige border border-rally-beige-dark/20',
  dark: 'bg-rally-gray-dark text-rally-beige-light',
  blue: 'bg-rally-blue-light border border-rally-blue',
  green: 'bg-rally-green-lighter border border-rally-green',
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      interactive = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-rally',
          variantClasses[variant],
          paddingClasses[padding],
          interactive &&
            'cursor-pointer hover:shadow-rally active:scale-[0.98] transition-all duration-150',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

// Card sub-components
export function CardHeader({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mb-3', className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-base font-black text-rally-gray-dark tracking-tight', className)}
      {...props}
    >
      {children}
    </h3>
  )
}

export function CardDescription({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm text-rally-gray leading-relaxed', className)} {...props}>
      {children}
    </p>
  )
}

export function CardFooter({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mt-4 flex items-center', className)} {...props}>
      {children}
    </div>
  )
}
