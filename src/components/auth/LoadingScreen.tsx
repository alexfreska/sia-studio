export function LoadingScreen({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-4">
      <div className="w-8 h-8 border-2 border-border-subtle border-t-accent rounded-full animate-[spin_700ms_linear_infinite]" />
      <p className="text-fg-muted text-sm">{message || 'Initializing…'}</p>
    </div>
  )
}
