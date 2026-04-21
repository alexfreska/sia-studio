import type { ReactNode } from 'react'

export function Hero({
  subtitle,
  children,
}: {
  subtitle?: string
  children: ReactNode
}) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="min-h-full flex items-center justify-center px-6 py-16 md:py-24">
        <div className="relative w-full max-w-2xl">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-64 w-[640px] opacity-30 blur-3xl bg-accent-gradient rounded-full"
          />
          <div className="relative text-center space-y-5 mb-12 md:mb-14">
            <h1 className="text-5xl md:text-6xl font-semibold text-fg tracking-tight leading-[1.05] text-balance animate-fade-in">
              Generate images.{' '}
              <span className="text-accent-gradient">Store them on Sia.</span>
            </h1>
            {subtitle && (
              <p
                className="text-fg-muted text-base md:text-lg max-w-xl mx-auto leading-relaxed text-pretty animate-fade-in"
                style={{ animationDelay: '80ms', animationFillMode: 'both' }}
              >
                {subtitle}
              </p>
            )}
          </div>
          <div
            className="relative animate-fade-in"
            style={{ animationDelay: '160ms', animationFillMode: 'both' }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
