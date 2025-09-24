import React from 'react';

import { DexieStorageProvider } from './dexie-storage-provider';
import { SupabaseStorageProvider } from './supabase-storage-provider';
import { useAuth } from '@/hooks/use-auth';

export const StorageProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const { supabaseEnabled, user } = useAuth();

    if (supabaseEnabled && user) {
        return <SupabaseStorageProvider>{children}</SupabaseStorageProvider>;
    }

    return <DexieStorageProvider>{children}</DexieStorageProvider>;
};
