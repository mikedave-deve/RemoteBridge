/**
 * PremierRemoteBridge mark: two circles, the employer and the professional. The lens
 * where they overlap is the bridge between them.
 */
export const LENS = 'M24 15.515A11 11 0 0 1 24 32.485A11 11 0 0 1 24 15.515Z'

export function LogoMark({ className = 'h-10 w-10', tone = 'brand' }) {
  const [left, right, lens] = tone === 'light' ? ['#4C99A7', '#FFFFFF', '#0F424D'] : ['#0F424D', '#4C99A7', '#06242B']
  return (
    <svg viewBox="4 8 40 32" className={className} aria-hidden="true">
      <circle cx="17" cy="24" r="11" fill={left} />
      <circle cx="31" cy="24" r="11" fill={right} />
      <path d={LENS} fill={lens} />
    </svg>
  )
}

export default function Logo({ tone = 'brand', className = '', size = 'md' }) {
  const light = tone === 'light'
  const s = size === 'lg'
    ? { mark: 'h-10 w-[50px]', word: 'text-[28px]' }
    : size === 'xs'
      ? { mark: 'h-6 w-[30px]', word: 'text-[16px]' }
      : size === 'sm'
        ? { mark: 'h-7 w-[35px]', word: 'text-[19px]' }
      : { mark: 'h-8 w-10', word: 'text-[23px]' }
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark tone={tone} className={`${s.mark} shrink-0`} />
      <span className={`font-sans ${s.word} font-[650] leading-none tracking-[-0.035em] ${light ? 'text-white' : 'text-ink'}`}>
        PremierRemoteBridge
      </span>
    </span>
  )
}
