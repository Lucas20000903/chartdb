import { createContext } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface DiagramPresenceParticipant {
    sessionId: string;
    presenceRef: string;
    userId: string;
    email?: string;
    name?: string;
    avatarUrl?: string;
    lastSeenAt: string;
}

export interface RemoteCursorState {
    sessionId: string;
    userId?: string | null;
    x: number;
    y: number;
    updatedAt: number;
}

export interface DiagramRealtimeContextValue {
    channel: RealtimeChannel | null;
    channelReady: boolean;
    sessionId: string;
    participants: DiagramPresenceParticipant[];
    remoteCursors: RemoteCursorState[];
    sendCursorUpdate: (cursor: { x: number; y: number } | null) => void;
}

export const diagramRealtimeContext =
    createContext<DiagramRealtimeContextValue>({
        channel: null,
        channelReady: false,
        sessionId: '',
        participants: [],
        remoteCursors: [],
        sendCursorUpdate: () => void 0,
    });
