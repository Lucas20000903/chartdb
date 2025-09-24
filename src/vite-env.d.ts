/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_OPENAI_API_KEY?: string;
    readonly VITE_OPENAI_API_ENDPOINT?: string;
    readonly VITE_LLM_MODEL_NAME?: string;
    readonly VITE_IS_CHARTDB_IO?: string;
    readonly VITE_APP_URL?: string;
    readonly VITE_HOST_URL?: string;
    readonly VITE_HIDE_CHARTDB_CLOUD?: string;
    readonly VITE_DISABLE_ANALYTICS?: string;
    readonly VITE_SUPABASE_URL?: string;
    readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
