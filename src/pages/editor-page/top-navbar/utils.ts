export const initialsFrom = (value?: string | null): string => {
    if (!value) return '?';

    const parts = value.trim().split(/\s+/).filter(Boolean);

    if (!parts.length) {
        return value.slice(0, 2).toUpperCase();
    }

    if (parts.length === 1) {
        return parts[0]!.slice(0, 2).toUpperCase();
    }

    return `${parts[0]![0] ?? ''}${parts.at(-1)?.[0] ?? ''}`.toUpperCase();
};
