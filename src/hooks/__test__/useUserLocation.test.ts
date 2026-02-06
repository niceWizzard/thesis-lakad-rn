import { renderHook, waitFor } from '@testing-library/react-native';
import * as Location from 'expo-location';
import { useUserLocation } from '../useUserLocation';

// Mock expo-location
jest.mock('expo-location', () => ({
    requestForegroundPermissionsAsync: jest.fn(),
    getCurrentPositionAsync: jest.fn(),
    watchPositionAsync: jest.fn(),
    Accuracy: {
        Highest: 6,
    },
}));

describe('useUserLocation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns null initially', () => {
        (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
        (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
            coords: { latitude: 10, longitude: 20 },
        });

        const { result } = renderHook(() => useUserLocation());
        expect(result.current).toBeNull();
    });

    it('updates location when permission is granted', async () => {
        (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
        (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
            coords: { latitude: 10, longitude: 20 },
        });
        (Location.watchPositionAsync as jest.Mock).mockImplementation(() => {
            return Promise.resolve({ remove: jest.fn() });
        });

        const { result } = renderHook(() => useUserLocation());

        await waitFor(() => {
            expect(result.current).toEqual([20, 10]); // longitude, latitude
        });
    });

    it('does not update if permission denied', async () => {
        (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

        const { result } = renderHook(() => useUserLocation());

        // Should remain null
        // We wait a bit to ensure async code runs (if any) but expect no change
        // waitFor will timeout if we expect something that never happens, but here we expect it NOT to change from null.
        // But renderHook waits for effects.

        // Let's settle for checking that location methods weren't called beyond permission
        await waitFor(() => {
            expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled();
        });
        expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
        expect(result.current).toBeNull();
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

        const { result } = renderHook(() => useUserLocation());

        await waitFor(() => {
            expect(result.current).toEqual([21, 11]);
        });
    });

    it('unsubscribes on unmount', async () => {
        (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
        (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
            coords: { latitude: 10, longitude: 20 },
        });

        const removeMock = jest.fn();
        (Location.watchPositionAsync as jest.Mock).mockResolvedValue({
            remove: removeMock
        });

        const { unmount } = renderHook(() => useUserLocation());

        // Wait for effect to finish and subscription to be set
        await waitFor(() => {
            expect(Location.watchPositionAsync).toHaveBeenCalled();
        });

        unmount();

        expect(removeMock).toHaveBeenCalled();
    });
});
