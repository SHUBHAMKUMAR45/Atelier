import React, { useState } from 'react';
import Image from 'next/image';
import type { ImageProps } from 'next/image';

interface FallbackImageProps extends ImageProps {
  fallbackSrc?: string;
}

const DEFAULT_FALLBACK = '/images/minimal_onboarding.png';

export function FallbackImage({ src, fallbackSrc = DEFAULT_FALLBACK, alt, ...props }: FallbackImageProps) {
  const [error, setError] = useState(false);
  
  // If the src is an object (static import) it doesn't need a string fallback check
  const imgSrc = error ? fallbackSrc : src;

  return (
    <Image
      src={imgSrc}
      alt={alt || 'Image'}
      onError={() => setError(true)}
      {...props}
    />
  );
}
