import React, { useMemo } from 'react';

import {
    storageContext,
    storageInitialValue,
} from '@/context/storage-context/storage-context';
import { createSupabaseStorage } from '@/lib/supabase/storage';
import { supabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';

export const SupabaseStorageProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const { user } = useAuth();
    const userId = user?.id ?? null;

    const value = useMemo(() => {
        if (!userId || !supabaseClient) {
            return storageInitialValue;
        }

        return createSupabaseStorage(supabaseClient, userId);
    }, [userId]);

    return (
        <storageContext.Provider value={value}>
            {children}
        </storageContext.Provider>
    );
};
