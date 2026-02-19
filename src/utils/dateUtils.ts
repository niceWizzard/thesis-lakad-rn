export const isValidDate = (d: any): d is Date => {
    return d instanceof Date && !isNaN(d.getTime());
}

export const parseTime = (timeStr?: string | null): Date | undefined => {
    if (!timeStr) return undefined;
    // Expected format: HH:mm:ss or HH:mm
    const [h, m, s] = timeStr.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return undefined;

    const date = new Date();
    date.setHours(h, m, s || 0, 0);
    return date;
}

export const formatTime = (date?: Date): string | undefined => {
    if (!isValidDate(date)) return undefined;
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    const s = date.getSeconds().toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
}

export const formatTimeDisplay = (timeStr?: string | null): string => {
    if (!timeStr) return 'N/A';
    const date = parseTime(timeStr);
    if (!date) return 'N/A';
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
