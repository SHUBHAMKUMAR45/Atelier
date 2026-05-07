import React, { useEffect, useRef } from 'react'
import { View, StyleSheet, Animated, ViewProps } from 'react-native'
import { COLORS, RADIUS } from '../../theme'

interface SkeletonProps extends ViewProps {
  width?: number
  height?: number
  circle?: boolean
  borderRadius?: number
}

export function Skeleton({ width, height, circle, borderRadius, style, ...props }: SkeletonProps) {
  const animatedValue = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start()
  }, [animatedValue])

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.8],
  })

  const computedRadius = circle ? 999 : (borderRadius ?? RADIUS.sm)

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width ?? ('100%' as unknown as number),
          height: height ?? 20,
          borderRadius: computedRadius,
          opacity,
        },
        style,
      ]}
      {...props}
    />
  )
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
})
