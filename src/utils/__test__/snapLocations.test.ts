import { snapLocations } from '../snapLocations';

// Mock fetch globally
global.fetch = jest.fn();

describe('snapLocations', () => {
    beforeEach(() => {
        (global.fetch as jest.Mock).mockClear();
    });

    it('successfully snaps locations', async () => {
        const mockResponse = {
            locations: [
                { location: [120.9842, 14.5995] },
                { location: [121.0, 14.6] }
            ]
        };

        (global.fetch as jest.Mock).mockResolvedValue({
            json: jest.fn().mockResolvedValue(mockResponse)
        });

        const inputData = [
            { coords: [120.9840, 14.5990], id: '1' },
            { coords: [121.01, 14.61], id: '2' }
        ];

        const result = await snapLocations({ data: inputData });

        expect(result).toEqual([
            [120.9842, 14.5995],
            [121.0, 14.6]
        ]);

        expect(global.fetch).toHaveBeenCalledTimes(1);
        const [url, options] = (global.fetch as jest.Mock).mock.calls[0];

        expect(url).toContain('https://api.openrouteservice.org/v2/snap/driving-car');
        expect(options.method).toBe('POST');
        expect(JSON.parse(options.body)).toEqual({
            locations: [
                [120.9840, 14.5990],
                [121.01, 14.61]
            ],
            radius: 1500
        });
    });

    it('handles API error response', async () => {
        const mockResponse = {
            error: {
                message: 'Rate limit exceeded'
            }
        };

        (global.fetch as jest.Mock).mockResolvedValue({
            json: jest.fn().mockResolvedValue(mockResponse)
        });

        const inputData = [{ coords: [120.9840, 14.5990], id: '1' }];

        await expect(snapLocations({ data: inputData }))
            .rejects
            .toThrow("Snap failed. Rate limit exceeded");
    });

    it('throws error when specific location snapping fails (returns null)', async () => {
        const mockResponse = {
            locations: [
                { location: [120.9842, 14.5995] },
                null // Failed to snap
            ]
        };

        (global.fetch as jest.Mock).mockResolvedValue({
            json: jest.fn().mockResolvedValue(mockResponse)
        });

        const inputData = [
            { coords: [120.9840, 14.5990], id: 'loc-1' },
            { coords: [0, 0], id: 'loc-fail' }
        ];

        await expect(snapLocations({ data: inputData }))
            .rejects
            .toThrow('Snapping failed! There is no road near landmark<"loc-fail">');
    });

    it('uses custom radius', async () => {
        const mockResponse = {
            locations: [{ location: [120.9842, 14.5995] }]
        };

        (global.fetch as jest.Mock).mockResolvedValue({
            json: jest.fn().mockResolvedValue(mockResponse)
        });

        const inputData = [{ coords: [120.9840, 14.5990], id: '1' }];

        await snapLocations({
            data: inputData,
            radius: 300
        });

        const [, options] = (global.fetch as jest.Mock).mock.calls[0];
        const body = JSON.parse(options.body);
        expect(body.radius).toBe(300);
    });
});
