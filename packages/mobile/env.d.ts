/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module 'vue-touch-events' {
  import type { App } from 'vue'
  export default function install(app: App): void
}

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_WS_URL: string
  readonly VITE_VAPID_PUBLIC_KEY: string
  readonly VITE_ENABLE_PWA: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}