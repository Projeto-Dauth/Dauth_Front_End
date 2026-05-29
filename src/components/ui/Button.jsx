const variants = {
  primary: 'bg-brand text-white border-brand hover:bg-[#72391f] active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2',
  ghost: 'bg-transparent text-ink-2 border-line hover:bg-surface-2 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-ink/20 focus-visible:ring-offset-2',
  outline: 'bg-surface text-ink border-line hover:border-ink-3 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-ink/20 focus-visible:ring-offset-2',
}

const sizes = {
  sm: 'px-[10px] py-[6px] text-sm rounded-sm',
  md: 'px-4 py-[10px] text-md rounded-md',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  disabled,
  ...props
}) {
  return (
    <button
      disabled={loading || disabled}
      className={`inline-flex items-center gap-2 font-body font-medium border cursor-pointer transition-all duration-150
        ${variants[variant]} ${sizes[size]} ${className}
        ${loading || disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      {...props}
    >
      {loading ? (
        <>
          <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          {children}
        </>
      ) : children}
    </button>
  )
}
