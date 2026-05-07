import React, { useState } from 'react';
import { Image } from 'expo-image';
import type { ImageProps } from 'expo-image';
import { View } from 'react-native';

interface FallbackImageProps extends ImageProps {
  fallbackSource?: any;
}

export function FallbackImage({ source, fallbackSource, style, ...props }: FallbackImageProps) {
  const [error, setError] = useState(false);
  
  // Expo Image accepts a source object or a required image
  // If the image fails to load, we fall back
  const defaultFallback = require('../../../assets/images/minimal_onboarding.png');
  const imgSource = error ? (fallbackSource || defaultFallback) : source;

  return (
    <Image
      source={imgSource}
      style={style}
      onError={() => setError(true)}
      transition={200}
      {...props}
    />
  );
}
