import React, { useMemo } from 'react';

import { useChartDB } from '@/hooks/use-chartdb';
import { useDiagramPresence } from '@/hooks/use-diagram-presence';
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from '@/components/avatar/avatar';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/tooltip/tooltip';
import { initialsFrom } from './utils';
import { useAuth } from '@/hooks/use-auth';

const MAX_VISIBLE_AVATARS = 4;

export const CollaboratorPresence: React.FC = () => {
    const { diagramId } = useChartDB();
    const { participants } = useDiagramPresence(diagramId);
    const { supabaseEnabled } = useAuth();

    const { visibleParticipants, hiddenCount } = useMemo(() => {
        const visible = participants.slice(0, MAX_VISIBLE_AVATARS);
        const remaining = Math.max(participants.length - visible.length, 0);

        return {
            visibleParticipants: visible,
            hiddenCount: remaining,
        };
    }, [participants]);

    if (!supabaseEnabled || !diagramId || participants.length === 0) {
        return null;
    }

    return (
        <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
                {visibleParticipants.map((participant) => {
                    const displayName =
                        participant.name ?? participant.email ?? 'Collaborator';

                    return (
                        <Tooltip key={participant.presenceRef}>
                            <TooltipTrigger asChild>
                                <Avatar className="size-7 border-2 border-background shadow sm:size-8">
                                    {participant.avatarUrl ? (
                                        <AvatarImage
                                            src={participant.avatarUrl}
                                            alt={displayName}
                                        />
                                    ) : null}
                                    <AvatarFallback className="text-[10px] font-semibold sm:text-xs">
                                        {initialsFrom(displayName)}
                                    </AvatarFallback>
                                </Avatar>
                            </TooltipTrigger>
                            <TooltipContent>{displayName}</TooltipContent>
                        </Tooltip>
                    );
                })}
            </div>
            {hiddenCount > 0 ? (
                <span className="text-xs text-muted-foreground">
                    +{hiddenCount}
                </span>
            ) : null}
        </div>
    );
};
