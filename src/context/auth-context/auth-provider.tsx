import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';

import { authContext, type AuthActionResult } from './auth-context';
import { supabaseClient } from '@/lib/supabase/client';
import { SUPABASE_ENABLED } from '@/lib/env';

export const AuthProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const client = useMemo(() => supabaseClient, []);
    const supabaseAvailable = SUPABASE_ENABLED && Boolean(client);
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!supabaseAvailable || !client) {
            setLoading(false);
            return;
        }

        let isMounted = true;

        const initialise = async () => {
            const { data, error } = await client.auth.getSession();

            if (!isMounted) return;

            if (error && import.meta.env.DEV) {
                console.error('Failed to retrieve session', error);
            }

            setSession(data.session ?? null);
            setUser(data.session?.user ?? null);
            setLoading(false);
        };

        void initialise();

        const {
            data: { subscription },
        } = client.auth.onAuthStateChange((_, nextSession) => {
            setSession(nextSession);
            setUser(nextSession?.user ?? null);
            setLoading(false);
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, [client, supabaseAvailable]);

    const actionUnavailableResult: AuthActionResult = useMemo(() => {
        return { error: new Error('Authentication is not configured.') };
    }, []);

    const signInWithPassword = useCallback(
        async (params: { email: string; password: string }) => {
            if (!supabaseAvailable || !client) {
                return actionUnavailableResult;
            }

            const { error } = await client.auth.signInWithPassword(params);

            return { error };
        },
        [actionUnavailableResult, client, supabaseAvailable]
    );

    const signUpWithPassword = useCallback(
        async (params: { email: string; password: string }) => {
            if (!supabaseAvailable || !client) {
                return actionUnavailableResult;
            }

            const { error } = await client.auth.signUp(params);

            return { error };
        },
        [actionUnavailableResult, client, supabaseAvailable]
    );

    const signOut = useCallback(async () => {
        if (!supabaseAvailable || !client) {
            return;
        }

        const { error } = await client.auth.signOut();

        if (error && import.meta.env.DEV) {
            console.error('Failed to sign out', error);
        }
    }, [client, supabaseAvailable]);

    const value = useMemo(
        () => ({
            user,
            session,
            loading,
            supabaseEnabled: supabaseAvailable,
            signInWithPassword,
            signUpWithPassword,
            signOut,
        }),
        [
            loading,
            session,
            signInWithPassword,
            signOut,
            signUpWithPassword,
            supabaseAvailable,
            user,
        ]
    );

    return (
        <authContext.Provider value={value}>{children}</authContext.Provider>
    );
};
