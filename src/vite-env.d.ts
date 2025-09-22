/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTODIALER_API_URL: string
  readonly VITE_TWILIO_TOKEN: string
  readonly VITE_BASE_URL: string
  readonly VITE_EMBED_TOKEN: string
  readonly VITE_PUSHER_APP_ID: string
  readonly VITE_PUSHER_CLUSTER: string
  readonly VITE_PUSHER_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
