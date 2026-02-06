import { createAndEditCommercialLandmarkSchema } from '../commercial';

describe('createAndEditCommercialLandmarkSchema', () => {
    const validData = {
        name: 'Valid Name',
        district: '1',
        municipality: 'Malolos',
        description: 'This is a valid description that is long enough.',
        latitude: '14.843',
        longitude: '120.811',
        gmaps_rating: '4.5',
        externalImageUrl: 'http://example.com/image.jpg'
    };

    it('validates correct data', () => {
        const result = createAndEditCommercialLandmarkSchema.safeParse(validData);
        expect(result.success).toBe(true);
    });

    it('validates minimum name length', () => {
        const result = createAndEditCommercialLandmarkSchema.safeParse({
            ...validData,
            name: 'Ab'
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toContain('Name must be at least 3 characters');
        }
    });

    it('validates minimum description length', () => {
        const result = createAndEditCommercialLandmarkSchema.safeParse({
            ...validData,
            description: 'Short'
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toContain('Description must be at least 10 characters');
        }
    });

    it('validates latitude range', () => {
        const result = createAndEditCommercialLandmarkSchema.safeParse({
            ...validData,
            latitude: '91'
        });
        expect(result.success).toBe(false);
    });

    it('validates latitude format', () => {
        const result = createAndEditCommercialLandmarkSchema.safeParse({
            ...validData,
            latitude: 'abc'
        });
        expect(result.success).toBe(false);
    });

    it('validates mismatching district and municipality', () => {
        // Malolos is in District 1, not District 2
        const result = createAndEditCommercialLandmarkSchema.safeParse({
            ...validData,
            district: '2',
            municipality: 'Malolos'
        });

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].path).toContain('municipality');
        }
    });

    it('validates gmaps_rating range', () => {
        const result = createAndEditCommercialLandmarkSchema.safeParse({
            ...validData,
            gmaps_rating: '6'
        });
        expect(result.success).toBe(false);
    });

    it('validates externalImageUrl URL format', () => {
        const result = createAndEditCommercialLandmarkSchema.safeParse({
            ...validData,
            externalImageUrl: 'not-a-url'
        });
        expect(result.success).toBe(false);
    });

    it('accepts optional fields missing', () => {
        const { gmaps_rating, externalImageUrl, ...requiredData } = validData;
        const result = createAndEditCommercialLandmarkSchema.safeParse(requiredData);
        expect(result.success).toBe(true);
    });

    it('accepts empty string for optional externalImageUrl', () => {
        const result = createAndEditCommercialLandmarkSchema.safeParse({
            ...validData,
            externalImageUrl: ''
        });
        expect(result.success).toBe(true);
    });
});
