import { useEffect, useMemo, useState } from 'react';

import { useAuth } from './use-auth';
import { supabaseClient } from '@/lib/supabase/client';
import { SUPABASE_ENABLED } from '@/lib/env';

interface PresencePayload {
    userId: string;
    email?: string;
    name?: string;
    avatarUrl?: string;
    lastSeenAt: string;
}

export interface DiagramPresenceParticipant extends PresencePayload {
    presenceRef: string;
}

const presenceUpdateIntervalMs = 30_000;

export const useDiagramPresence = (diagramId?: string) => {
    const { user, supabaseEnabled } = useAuth();
    const [participants, setParticipants] = useState<
        DiagramPresenceParticipant[]
    >([]);

    useEffect(() => {
        if (!diagramId || !user || !supabaseEnabled || !SUPABASE_ENABLED) {
            setParticipants([]);
            return;
        }

        if (!supabaseClient) {
            setParticipants([]);
            return;
        }

        const channel = supabaseClient.channel(`diagram:${diagramId}`, {
            config: {
                presence: {
                    key: user.id,
                },
            },
        });

        const syncPresenceState = () => {
            const state = channel.presenceState<PresencePayload>();
            const nextParticipants = Object.values(state)
                .flatMap((entries) => entries)
                .map((entry, index) => {
                    const { presence_ref: presenceRef } =
                        entry as PresencePayload & {
                            presence_ref?: string;
                        };

                    return {
                        ...entry,
                        presenceRef:
                            presenceRef ?? `${entry.userId}-${String(index)}`,
                    };
                })
                .sort((a, b) => {
                    const aName = a.name ?? '';
                    const bName = b.name ?? '';
                    return aName.localeCompare(bName);
                });

            setParticipants(nextParticipants);
        };

        channel
            .on('presence', { event: 'sync' }, syncPresenceState)
            .on('presence', { event: 'join' }, syncPresenceState)
            .on('presence', { event: 'leave' }, syncPresenceState);

        let keepAliveTimer: ReturnType<typeof setInterval> | undefined;

        void channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await channel.track({
                    userId: user.id,
                    email: user.email ?? undefined,
                    name:
                        (user.user_metadata?.full_name as string | undefined) ??
                        user.email ??
                        'Anonymous user',
                    avatarUrl:
                        (user.user_metadata?.avatar_url as
                            | string
                            | undefined) ?? undefined,
                    lastSeenAt: new Date().toISOString(),
                });

                syncPresenceState();

                keepAliveTimer = setInterval(() => {
                    void channel.track({
                        userId: user.id,
                        email: user.email ?? undefined,
                        name:
                            (user.user_metadata?.full_name as
                                | string
                                | undefined) ??
                            user.email ??
                            'Anonymous user',
                        avatarUrl:
                            (user.user_metadata?.avatar_url as
                                | string
                                | undefined) ?? undefined,
                        lastSeenAt: new Date().toISOString(),
                    });
                }, presenceUpdateIntervalMs);
            }
        });

        return () => {
            if (keepAliveTimer) {
                clearInterval(keepAliveTimer);
            }
            setParticipants([]);
            void channel.unsubscribe();
        };
    }, [diagramId, supabaseEnabled, user]);

    const others = useMemo(
        () =>
            participants.filter(
                (participant) => participant.userId !== user?.id
            ),
        [participants, user?.id]
    );

    return {
        participants,
        others,
    };
};
