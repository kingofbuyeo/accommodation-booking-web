import type { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: boolean
}

export default function Card({ children, className = '', padding = true, ...rest }: CardProps) {
  return (
    <div
      className={`rounded-xl bg-white shadow-sm ring-1 ring-gray-200 ${padding ? 'p-6' : ''} ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}
