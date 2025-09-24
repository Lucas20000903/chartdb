import { createContext } from 'react';
import type { Session, User, AuthError } from '@supabase/supabase-js';

import { SUPABASE_ENABLED } from '@/lib/env';

export interface AuthActionResult {
    error: AuthError | Error | null;
}

export interface AuthContextValue {
    user: User | null;
    session: Session | null;
    loading: boolean;
    supabaseEnabled: boolean;
    signInWithPassword: (params: {
        email: string;
        password: string;
    }) => Promise<AuthActionResult>;
    signUpWithPassword: (params: {
        email: string;
        password: string;
    }) => Promise<AuthActionResult>;
    signOut: () => Promise<void>;
}

const disabledResult: AuthActionResult = {
    error: new Error('Authentication is not configured.'),
};

export const authContext = createContext<AuthContextValue>({
    user: null,
    session: null,
    loading: true,
    supabaseEnabled: SUPABASE_ENABLED,
    signInWithPassword: async () => disabledResult,
    signUpWithPassword: async () => disabledResult,
    signOut: async () => void 0,
});
