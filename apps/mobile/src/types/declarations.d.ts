// Type declarations for monorepo workspace packages used in Expo app

declare module '@ai-fashion/shared' {
  export * from '../../../packages/shared/src'
}

declare module '@ai-fashion/shared/schemas' {
  export * from '../../../packages/shared/src/schemas'
}

declare module '@ai-fashion/shared/utils' {
  export * from '../../../packages/shared/src/utils'
}

// Expo asset types
declare module '*.png' {
  const value: number
  export default value
}

declare module '*.jpg' {
  const value: number
  export default value
}

declare module '*.ttf' {
  const value: number
  export default value
}
