import React, { useMemo } from 'react';

import { useDiagramRealtime } from '@/context/diagram-realtime-context/use-diagram-realtime';
import { useDiagramPresence } from '@/hooks/use-diagram-presence';

const stringToColor = (value: string) => {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
        hash = value.charCodeAt(index) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 85%, 60%)`;
};

interface CollaboratorCursorsProps {
    containerRef: React.RefObject<HTMLDivElement>;
}

export const CollaboratorCursors: React.FC<CollaboratorCursorsProps> = ({
    containerRef,
}) => {
    const { remoteCursors, sessionId } = useDiagramRealtime();
    const { participants } = useDiagramPresence();

    const participantBySession = useMemo(() => {
        return new Map(
            participants.map((participant) => [
                participant.sessionId,
                participant,
            ])
        );
    }, [participants]);

    const activeCursors = useMemo(() => {
        const now = Date.now();
        return remoteCursors.filter((cursor) => {
            if (cursor.sessionId === sessionId) {
                return false;
            }

            if (cursor.x < 0 || cursor.x > 1 || cursor.y < 0 || cursor.y > 1) {
                return false;
            }

            return now - cursor.updatedAt < 10_000;
        });
    }, [remoteCursors, sessionId]);

    if (!containerRef.current || activeCursors.length === 0) {
        return null;
    }

    return (
        <div className="pointer-events-none absolute inset-0 z-[2] overflow-visible">
            {activeCursors.map((cursor) => {
                const participant = participantBySession.get(cursor.sessionId);
                const name =
                    participant?.name ?? participant?.email ?? 'Collaborator';
                const color = stringToColor(cursor.sessionId);

                return (
                    <div
                        key={cursor.sessionId}
                        className="pointer-events-none absolute"
                        style={{
                            left: `${cursor.x * 100}%`,
                            top: `${cursor.y * 100}%`,
                        }}
                    >
                        <div className="flex -translate-x-1/2 -translate-y-1/2 flex-col items-start gap-1">
                            <div
                                className="flex items-center gap-2 rounded-full border bg-white/80 px-3 py-1 text-xs font-medium text-slate-900 shadow-md backdrop-blur-sm"
                                style={{ borderColor: color }}
                            >
                                <span
                                    className="inline-flex size-2 rounded-full"
                                    style={{ backgroundColor: color }}
                                />
                                <span>{name}</span>
                            </div>
                            <div
                                className="size-2 rotate-45 rounded-sm"
                                style={{ backgroundColor: color }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
