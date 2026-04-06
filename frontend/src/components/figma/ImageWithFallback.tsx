import React, { useState } from 'react'
import MascotBlack from '../../assets/Hricochets-Mascot-Black.svg'

const FALLBACK_TAGLINE = 'no preview available right now'

export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [didError, setDidError] = useState(false)

  const handleError = () => {
    setDidError(true)
  }

  const { src, alt, style, className, ...rest } = props
  const isMissingSrc = !src || (typeof src === 'string' && src.trim() === '')

  return didError || isMissingSrc ? (
    <div
      className={`inline-block bg-gray-50 text-center align-middle ${className ?? ''}`}
      style={style}
    >
      <div className="flex flex-col items-center justify-center w-full h-full gap-3 p-4">
        <img src={MascotBlack} alt="No preview available" className="w-20 h-20 opacity-80" />
        <span className="text-[11px] uppercase tracking-wide text-gray-500">{FALLBACK_TAGLINE}</span>
      </div>
    </div>
  ) : (
    <img src={src} alt={alt} className={className} style={style} {...rest} onError={handleError} />
  )
}
