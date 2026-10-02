import { useState } from 'react'

/** Image with a branded fallback so a slow or missing photo never leaves a hole. */
export default function Img({ src, alt, className = '' }) {
  const [failed, setFailed] = useState(false)
  if (failed || !src)
    return (
      <div role="img" aria-label={alt} className={`relative grid place-items-center overflow-hidden bg-gradient-to-br from-bridge-200 via-bridge-300 to-bridge-500 ${className}`}>
        <svg className="absolute inset-0 h-full w-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d="M-10 100 A60 60 0 0 1 110 100" fill="none" stroke="#fff" strokeWidth=".6" />
          <path d="M-10 100 A45 45 0 0 1 110 100" fill="none" stroke="#fff" strokeWidth=".6" />
        </svg>
      </div>
    )
  return <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} className={`object-cover ${className}`} />
}
