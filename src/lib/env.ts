export const OPENAI_API_KEY: string = import.meta.env.VITE_OPENAI_API_KEY;
export const OPENAI_API_ENDPOINT: string = import.meta.env
    .VITE_OPENAI_API_ENDPOINT;
export const LLM_MODEL_NAME: string = import.meta.env.VITE_LLM_MODEL_NAME;
export const IS_CHARTDB_IO: boolean =
    import.meta.env.VITE_IS_CHARTDB_IO === 'true';
export const APP_URL: string = import.meta.env.VITE_APP_URL;
export const HOST_URL: string = import.meta.env.VITE_HOST_URL ?? '';
export const HIDE_CHARTDB_CLOUD: boolean =
    (window?.env?.HIDE_CHARTDB_CLOUD ??
        import.meta.env.VITE_HIDE_CHARTDB_CLOUD) === 'true';
export const DISABLE_ANALYTICS: boolean =
    (window?.env?.DISABLE_ANALYTICS ??
        import.meta.env.VITE_DISABLE_ANALYTICS) === 'true';

const resolveEnvValue = (key: string): string => {
    const windowValue = window?.env?.[key];

    if (typeof windowValue === 'string') {
        return windowValue;
    }

    const importMetaKey = `VITE_${key}` as keyof ImportMetaEnv;
    const importMetaValue = import.meta.env[importMetaKey];

    return typeof importMetaValue === 'string' ? importMetaValue : '';
};

export const SUPABASE_URL: string = resolveEnvValue('SUPABASE_URL');
export const SUPABASE_ANON_KEY: string = resolveEnvValue('SUPABASE_ANON_KEY');
export const SUPABASE_ENABLED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
