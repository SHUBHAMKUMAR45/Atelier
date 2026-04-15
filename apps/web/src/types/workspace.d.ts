// Type declarations for monorepo workspace packages
// These allow TypeScript to resolve @ai-fashion/shared imports in the web app

declare module '@ai-fashion/shared' {
  export * from '../../packages/shared/src'
}

declare module '@ai-fashion/shared/schemas' {
  export * from '../../packages/shared/src/schemas'
}

declare module '@ai-fashion/shared/utils' {
  export * from '../../packages/shared/src/utils'
}
