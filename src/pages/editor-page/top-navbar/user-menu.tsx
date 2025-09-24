import React, { useMemo } from 'react';

import { useAuth } from '@/hooks/use-auth';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/dropdown-menu/dropdown-menu';
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from '@/components/avatar/avatar';
import { initialsFrom } from './utils';

export const UserMenu: React.FC = () => {
    const { user, signOut, supabaseEnabled } = useAuth();

    const displayName = useMemo(() => {
        if (!user) return '';

        return (
            (user.user_metadata?.full_name as string | undefined) ??
            user.email ??
            'Anonymous user'
        );
    }, [user]);

    const avatarUrl =
        (user?.user_metadata?.avatar_url as string | undefined) ?? undefined;

    if (!supabaseEnabled || !user) {
        return null;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className="flex items-center gap-2 rounded-full border border-transparent bg-transparent px-2 py-1 transition hover:border-accent"
                >
                    <Avatar className="size-8">
                        {avatarUrl ? (
                            <AvatarImage src={avatarUrl} alt={displayName} />
                        ) : null}
                        <AvatarFallback className="text-sm font-medium">
                            {initialsFrom(displayName)}
                        </AvatarFallback>
                    </Avatar>
                    <span className="hidden text-sm font-medium sm:inline-block">
                        {displayName}
                    </span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Signed in as
                </DropdownMenuLabel>
                <DropdownMenuItem disabled className="truncate text-sm">
                    {displayName}
                </DropdownMenuItem>
                {user.email ? (
                    <DropdownMenuItem
                        disabled
                        className="truncate text-xs text-muted-foreground"
                    >
                        {user.email}
                    </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onSelect={(event) => {
                        event.preventDefault();
                        void signOut();
                    }}
                >
                    Sign out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
