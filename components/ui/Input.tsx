import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helperText?: string
  error?: string
  fullWidth?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, fullWidth = true, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-bold text-rally-gray-dark tracking-widest uppercase"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'bg-white border-2 rounded-rally px-4 py-3 text-rally-gray-dark text-sm font-medium placeholder:text-rally-gray/40',
            'focus:outline-none transition-colors',
            error
              ? 'border-red-400 focus:border-red-500'
              : 'border-rally-beige-dark focus:border-rally-blue-dark',
            fullWidth && 'w-full',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-red-500 text-xs font-medium mt-0.5">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-rally-gray text-xs mt-0.5">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

// Textarea variant
export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  helperText?: string
  error?: string
  fullWidth?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helperText, error, fullWidth = true, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-bold text-rally-gray-dark tracking-widest uppercase"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'bg-white border-2 rounded-rally px-4 py-3 text-rally-gray-dark text-sm font-medium placeholder:text-rally-gray/40',
            'focus:outline-none transition-colors resize-none',
            error
              ? 'border-red-400 focus:border-red-500'
              : 'border-rally-beige-dark focus:border-rally-blue-dark',
            fullWidth && 'w-full',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-red-500 text-xs font-medium mt-0.5">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-rally-gray text-xs mt-0.5">{helperText}</p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

// PIN input component
export interface PinInputProps {
  length?: number
  value: string[]
  onChange: (value: string[]) => void
  show?: boolean
  label?: string
  error?: string
}

export function PinInput({
  length = 4,
  value,
  onChange,
  show = false,
  label,
  error,
}: PinInputProps) {
  const handleChange = (index: number, char: string) => {
    if (!/^\d*$/.test(char)) return
    const newValue = [...value]
    newValue[index] = char.slice(-1)
    onChange(newValue)
  }

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <span className="block text-xs font-bold text-rally-gray-dark tracking-widest uppercase">
          {label}
        </span>
      )}
      <div className="flex gap-3 justify-center">
        {Array.from({ length }).map((_, i) => (
          <div key={i} className="relative">
            <input
              type={show ? 'tel' : 'password'}
              inputMode="numeric"
              maxLength={1}
              value={value[i] || ''}
              onChange={(e) => handleChange(i, e.target.value)}
              className={cn(
                'w-14 h-14 text-center text-xl font-black bg-white border-2 rounded-rally transition-all focus:outline-none',
                value[i]
                  ? 'border-rally-blue-dark text-rally-gray-dark'
                  : 'border-rally-beige-dark text-rally-gray/30',
                'focus:border-rally-blue-dark'
              )}
            />
            {!show && value[i] && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-2.5 h-2.5 rounded-full bg-rally-gray-dark" />
              </div>
            )}
          </div>
        ))}
      </div>
      {error && <p className="text-red-500 text-xs font-medium text-center">{error}</p>}
    </div>
  )
}
