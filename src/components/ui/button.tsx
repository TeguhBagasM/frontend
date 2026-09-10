import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'default' | 'outline' | 'ghost'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
}

const baseClass =
  'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60'

const variantClass: Record<ButtonVariant, string> = {
  default: 'bg-blue-600 text-white hover:bg-blue-700',
  outline: 'border border-slate-300 text-slate-700 hover:bg-slate-100',
  ghost: 'text-slate-600 hover:bg-slate-100',
}

export function Button({
  variant = 'default',
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return <button type={type} className={`${baseClass} ${variantClass[variant]} ${className}`} {...props} />
}