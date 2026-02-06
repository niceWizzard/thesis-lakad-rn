import { createAndEditLandmarkSchema } from '../landmark';

describe('createAndEditLandmarkSchema', () => {
    const validData = {
        name: 'Historical Site',
        type: 'Historic Site',
        district: '1',
        municipality: 'Malolos',
        description: 'This is a description that meets the minimum length requirements.',
        latitude: '14.843',
        longitude: '120.811',
        gmaps_rating: '4.8',
        externalImageUrl: 'http://example.com/photo.jpg'
    };

    const validLandmarkData = {
        ...validData,
        type: 'Historical Site'
    };

    it('validates correct data', () => {
        const result = createAndEditLandmarkSchema.safeParse(validLandmarkData);
        expect(result.success).toBe(true);
    });

    it('validates invalid landmark type', () => {
        const result = createAndEditLandmarkSchema.safeParse({
            ...validLandmarkData,
            type: 'Invalid Type'
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toContain('Select at least one category');
        }
    });

    it('validates minimum name length', () => {
        const result = createAndEditLandmarkSchema.safeParse({
            ...validLandmarkData,
            name: 'Ab'
        });
        expect(result.success).toBe(false);
    });

    it('validates minimum description length', () => {
        const result = createAndEditLandmarkSchema.safeParse({
            ...validLandmarkData,
            description: 'Short'
        });
        expect(result.success).toBe(false);
    });

    it('validates latitude/longitude', () => {
        const result = createAndEditLandmarkSchema.safeParse({
            ...validLandmarkData,
            latitude: '100', // invalid
        });
        expect(result.success).toBe(false);
    });

    it('validates mismatching jurisdiction', () => {
        const result = createAndEditLandmarkSchema.safeParse({
            ...validLandmarkData,
            district: '1',
            municipality: 'Baliwag' // Baliwag is in District 2
        });
        expect(result.success).toBe(false);
    });
});
