import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { SUPABASE_ANON_KEY, SUPABASE_ENABLED, SUPABASE_URL } from '@/lib/env';

export type ChartDBSupabaseClient = SupabaseClient | undefined;

let cachedClient: ChartDBSupabaseClient;

if (SUPABASE_ENABLED) {
    cachedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            storageKey: 'chartdb-auth',
        },
        realtime: {
            params: {
                eventsPerSecond: 2,
            },
        },
    });
} else {
    cachedClient = undefined;
    if (import.meta.env.DEV) {
        console.warn(
            'Supabase environment variables are not set. Authentication and realtime collaboration features are disabled.'
        );
    }
}

export const supabaseClient = cachedClient;
