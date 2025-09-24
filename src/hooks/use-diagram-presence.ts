import { useMemo } from 'react';

import { useDiagramRealtime } from '@/context/diagram-realtime-context/use-diagram-realtime';

export type { DiagramPresenceParticipant } from '@/context/diagram-realtime-context/diagram-realtime-context';

export const useDiagramPresence = () => {
    const { participants, sessionId } = useDiagramRealtime();

    const others = useMemo(
        () =>
            participants.filter(
                (participant) => participant.sessionId !== sessionId
            ),
        [participants, sessionId]
    );

    return {
        participants,
        others,
    };
};
