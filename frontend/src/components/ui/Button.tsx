import { cn } from '@/lib/utils'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ips-gold/50 disabled:opacity-50 disabled:pointer-events-none',
          {
            'bg-ips-blue text-white hover:bg-ips-blue-dark shadow-lg shadow-ips-blue/25': variant === 'primary',
            'bg-ips-gold text-ips-blue hover:bg-ips-gold-light shadow-lg shadow-ips-gold/25': variant === 'secondary',
            'border-2 border-ips-blue text-ips-blue hover:bg-ips-blue hover:text-white dark:border-ips-gold dark:text-ips-gold dark:hover:bg-ips-gold dark:hover:text-ips-blue': variant === 'outline',
            'text-ips-blue hover:bg-ips-blue/10 dark:text-ips-gold dark:hover:bg-ips-gold/10': variant === 'ghost',
            'px-4 py-2 text-sm': size === 'sm',
            'px-6 py-3 text-base': size === 'md',
            'px-8 py-4 text-lg': size === 'lg',
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }
