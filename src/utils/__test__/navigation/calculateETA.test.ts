import { calculateETA, getETATime } from '../../navigation/calculateETA';

describe('calculateETA', () => {
    beforeAll(() => {
        // Mock a fixed date: 2023-10-05 10:00:00 AM
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2023-10-05T10:00:00'));
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    it('calculates correct ETA', () => {
        // 1 hour later -> 11:00 AM
        const duration = 3600;
        expect(calculateETA(duration)).toBe('Arrive at 11:00 AM');
    });

    it('handles PM rollover', () => {
        // 4 hours later -> 2:00 PM
        const duration = 3600 * 4;
        expect(calculateETA(duration)).toBe('Arrive at 2:00 PM');
    });

    it('handles minute padding', () => {
        // 1 hour 5 mins later -> 11:05 AM
        const duration = 3600 + 300;
        expect(calculateETA(duration)).toBe('Arrive at 11:05 AM');
    });

    it('handles next day (just returns time)', () => {
        // 24 hours later -> 10:00 AM
        const duration = 3600 * 24;
        expect(calculateETA(duration)).toBe('Arrive at 10:00 AM');
    });
});

describe('getETATime', () => {
    beforeAll(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2023-10-05T10:00:00'));
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    it('returns time only', () => {
        // 30 mins later -> 10:30 AM
        expect(getETATime(1800)).toBe('10:30 AM');
    });
});
