import { formatDuration, formatDurationShort } from '../../format/duration';

describe('formatDuration', () => {
    it('formats minutes only', () => {
        expect(formatDuration(600)).toBe('10 min');
        expect(formatDuration(59)).toBe('0 min');
    });

    it('formats hours only', () => {
        expect(formatDuration(3600)).toBe('1h');
        expect(formatDuration(7200)).toBe('2h');
    });

    it('formats hours and minutes', () => {
        expect(formatDuration(3660)).toBe('1h 1min');
        expect(formatDuration(5430)).toBe('1h 30min');
    });
});

describe('formatDurationShort', () => {
    it('formats minutes only', () => {
        expect(formatDurationShort(600)).toBe('10m');
        expect(formatDurationShort(59)).toBe('0m');
    });

    it('formats hours only', () => {
        expect(formatDurationShort(3600)).toBe('1h');
    });

    it('formats hours and minutes', () => {
        expect(formatDurationShort(3660)).toBe('1h 1m');
        expect(formatDurationShort(5430)).toBe('1h 30m');
    });
});
