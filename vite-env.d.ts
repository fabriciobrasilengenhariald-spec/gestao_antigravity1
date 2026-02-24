/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_GEMINI_API_KEY: string
    readonly VITE_TELEGRAM_BOT_TOKEN: string
    // add other env variables here...
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
