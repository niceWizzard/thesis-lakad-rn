import { renderHook, waitFor } from '@testing-library/react-native';
import * as Location from 'expo-location';
import { useUserLocation } from '../useUserLocation';

// Mock expo-location
jest.mock('expo-location', () => ({
    requestForegroundPermissionsAsync: jest.fn(),
    getCurrentPositionAsync: jest.fn(),
    watchPositionAsync: jest.fn(),
    watchHeadingAsync: jest.fn(),
    Accuracy: {
        Highest: 6,
    },
}));

describe('useUserLocation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns null initially', async () => {
        (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
        (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
            coords: { latitude: 10, longitude: 20 },
        });

        const { result } = renderHook(() => useUserLocation());
        expect(result.current.userLocation).toBeNull();
        expect(result.current.heading).toBeNull();

        // Wait for the effect's async update to happen
        await waitFor(() => {
            expect(result.current.userLocation).not.toBeNull();
        });
    });

    it('updates location when permission is granted', async () => {
        (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
        (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
            coords: { latitude: 10, longitude: 20 },
        });
        (Location.watchPositionAsync as jest.Mock).mockImplementation(() => {
            return Promise.resolve({ remove: jest.fn() });
        });
        (Location.watchHeadingAsync as jest.Mock).mockImplementation(() => {
            return Promise.resolve({ remove: jest.fn() });
        });

        const { result } = renderHook(() => useUserLocation());

        await waitFor(() => {
            expect(result.current.userLocation).toEqual([20, 10]); // longitude, latitude
        });
    });

    it('does not update if permission denied', async () => {
        (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

        const { result } = renderHook(() => useUserLocation());

        await waitFor(() => {
            expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled();
        });
        expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
        expect(result.current.userLocation).toBeNull();
    });

    it('subscribes to updates', async () => {
        (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
        (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
            coords: { latitude: 10, longitude: 20 },
        });

        // Mock watchPositionAsync to call the callback immediately
        (Location.watchPositionAsync as jest.Mock).mockImplementation(async (options, callback) => {
            callback({ coords: { latitude: 11, longitude: 21 } });
            return { remove: jest.fn() };
        });
        (Location.watchHeadingAsync as jest.Mock).mockImplementation(async (callback) => {
            callback({ trueHeading: 90 });
            return { remove: jest.fn() };
        });


        const { result } = renderHook(() => useUserLocation());

        await waitFor(() => {
            expect(result.current.userLocation).toEqual([21, 11]);
            expect(result.current.heading).toBe(90);
        });
    });

    it('unsubscribes on unmount', async () => {
        (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
        (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
            coords: { latitude: 10, longitude: 20 },
        });

        const removeMockLocation = jest.fn();
        const removeMockHeading = jest.fn();

        (Location.watchPositionAsync as jest.Mock).mockResolvedValue({
            remove: removeMockLocation
        });
        (Location.watchHeadingAsync as jest.Mock).mockResolvedValue({
            remove: removeMockHeading
        });


        const { unmount } = renderHook(() => useUserLocation());

        // Wait for effect to finish and subscription to be set
        await waitFor(() => {
            expect(Location.watchPositionAsync).toHaveBeenCalled();
        });

        unmount();

        expect(removeMockLocation).toHaveBeenCalled();
        expect(removeMockHeading).toHaveBeenCalled();
    });
});
