import { getHaversineDistance } from '../../distance/getHaversineDistance';

describe('getHaversineDistance', () => {
    it('returns 0 for same location', () => {
        const pos: [number, number] = [10, 10]; // GeoJSON.Position is number[] but we can treat as tuple for test
        expect(getHaversineDistance(pos, pos)).toBe(0);
    });

    it('calculates correct distance', () => {
        // Point 1: 52.5200° N, 13.4050° E (Berlin)
        // Point 2: 48.8566° N, 2.3522° E (Paris)
        // Distance ~878 km
        const berlin: [number, number] = [52.52, 13.405];
        const paris: [number, number] = [48.8566, 2.3522];

        const dist = getHaversineDistance(berlin, paris);

        // Allow for some error due to earth radius approximation
        expect(dist).toBeGreaterThan(870000);
        expect(dist).toBeLessThan(885000);
    });

    it('handles negative coordinates', () => {
        const p1: [number, number] = [-10, -10];
        const p2: [number, number] = [-10.01, -10]; // ~1.1km away (approx 1 degree lat is 111km, 0.01 is 1.11km)
        // 1 degree latitude is approx 111,320m
        // 0.01 degree is approx 1113.2m
        const dist = getHaversineDistance(p1, p2);

        expect(dist).toBeGreaterThan(1110);
        expect(dist).toBeLessThan(1120);
    });
});
