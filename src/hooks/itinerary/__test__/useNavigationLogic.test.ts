import { useToastNotification } from '@/src/hooks/useToastNotification';
import { getHaversineDistance } from '@/src/utils/distance/getHaversineDistance';
import { fetchDirections } from '@/src/utils/navigation/fetchDirections';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { nearestPointOnLine } from '@turf/turf';
import { useNavigationLogic } from '../useNavigationLogic';
import { Mode } from '../useNavigationState';
import { route } from './navigation.sample';

// Mock dependencies
jest.mock('@/src/utils/navigation/fetchDirections', () => ({
    fetchDirections: jest.fn(),
}));

jest.mock('@/src/hooks/useToastNotification', () => ({
    useToastNotification: jest.fn(),
}));

jest.mock('@/src/utils/toggleStopStatus', () => ({
    toggleStopStatus: jest.fn(),
}));

jest.mock('@/src/utils/distance/getHaversineDistance', () => ({
    getHaversineDistance: jest.fn(),
}));

jest.mock('@/src/utils/distance/getDistanceToSegment', () => ({
    getDistanceToSegment: jest.fn(),
}));

jest.mock('expo-router', () => ({
    useFocusEffect: (cb: any) => jest.requireActual('react').useEffect(cb, [cb]),
}));


jest.mock('@tanstack/react-query', () => ({
    useQueryClient: jest.fn(() => ({
        invalidateQueries: jest.fn(),
    })),
}));

jest.mock('@turf/turf', () => ({
    nearestPointOnLine: jest.fn(),
    distance: jest.requireActual('@turf/turf').distance,
    point: jest.requireActual('@turf/turf').point,
    lineSlice: jest.fn(),
    length: jest.fn(),
}));

describe('useNavigationLogic', () => {
    const mockShowToast = jest.fn();
    const mockSetNavigationRoute = jest.fn();
    const mockSwitchMode = jest.fn();
    const mockRefetchItinerary = jest.fn();
    const mockCamera = {
        setCamera: jest.fn(),
    };

    const defaultProps = {
        mode: Mode.Viewing,
        userLocation: [120.0, 14.0] as [number, number],
        navigationRoute: route,
        setNavigationRoute: mockSetNavigationRoute,
        switchMode: mockSwitchMode,
        nextUnvisitedStop: {
            id: '1',
            landmark: { longitude: 120.1, latitude: 14.1 }
        } as any,
        refetchItinerary: mockRefetchItinerary,
        pasalubongs: [],
        cameraRef: { current: mockCamera } as any,
        navigationProfile: 'driving' as const,
        avoidTolls: false,

    } as Parameters<typeof useNavigationLogic>[0];

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        (useToastNotification as jest.Mock).mockReturnValue({ showToast: mockShowToast });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('startNavigation works correctly', async () => {
        (fetchDirections as jest.Mock).mockResolvedValue({
            routes: [{
                legs: [{ steps: [{ maneuver: { bearing_after: 0 } }] }]
            }]
        });

        const { result } = renderHook(() => useNavigationLogic(defaultProps));

        await act(async () => {
            await result.current.startNavigation();
        });

        expect(fetchDirections).toHaveBeenCalled();
        expect(mockSetNavigationRoute).toHaveBeenCalled();
        expect(mockSwitchMode).toHaveBeenCalledWith(Mode.Navigating);
        expect(mockCamera.setCamera).toHaveBeenCalled();

        // Fast-forward time to handle the setTimeout(..., 1500)
        act(() => {
            jest.runAllTimers();
        });
    });

    it('startNavigation shows toast if no stops left', async () => {
        const { result } = renderHook(() => useNavigationLogic({
            ...defaultProps,
            nextUnvisitedStop: null,
        }));

        await act(async () => {
            await result.current.startNavigation();
        });

        expect(mockShowToast).toHaveBeenCalledWith(expect.objectContaining({
            title: "No stops left"
        }));
        expect(fetchDirections).not.toHaveBeenCalled();
    });


    it('detects arrival when user is close', async () => {
        (getHaversineDistance as jest.Mock).mockReturnValue(5); // < 10m

        const { rerender } = renderHook((props: any) => useNavigationLogic(props), {
            initialProps: { ...defaultProps, mode: Mode.Navigating }
        });

        rerender({
            ...defaultProps,
            mode: Mode.Navigating,
            userLocation: [120.10001, 14.10001]
        });

        // Effect runs asynchronously inside useFocusEffect -> useCallback
        await waitFor(() => {
            expect(mockShowToast).toHaveBeenCalledWith(expect.objectContaining({
                title: "You have arrived!"
            }));
        });

        expect(mockSwitchMode).toHaveBeenCalledWith(Mode.Viewing);
    });

    it('reroutes when off-route', async () => {
        jest.useRealTimers();
        (getHaversineDistance as jest.Mock).mockReturnValue(60);
        (fetchDirections as jest.Mock).mockResolvedValue({ routes: [] });
        (nearestPointOnLine as jest.Mock).mockReturnValue({
            geometry: { coordinates: [120.1, 14.1] }
        });

        const { result, rerender } = renderHook((props: any) => useNavigationLogic(props), {
            initialProps: {
                ...defaultProps,
                mode: Mode.Navigating,
                navigationRoute: [{
                    legs: [{ steps: [{ maneuver: { location: [120.1, 14.1] } }] }],
                    geometry: { coordinates: [[120, 14], [120.1, 14.1]] }
                }] as any
            }
        });

        rerender({
            ...defaultProps,
            mode: Mode.Navigating,
            navigationRoute: [{
                legs: [{ steps: [{ maneuver: { location: [120.1, 14.1] } }] }],
                geometry: { coordinates: [[120, 14], [120.1, 14.1]] }
            }] as any,
            userLocation: [120.2, 14.2] // New location
        });

        await waitFor(() => {
            expect(mockSetNavigationRoute).toHaveBeenCalled();
            expect(result.current.isCalculatingRoute).toBe(false);
        });

        expect(fetchDirections).toHaveBeenCalled();
    });

    it('moves to next step when user is close', async () => {
        // 1. Mock Haversine sequence
        (getHaversineDistance as jest.Mock)
            .mockReturnValueOnce(100) // Arrival check (> 10)
            .mockReturnValueOnce(3)   // Step advance check (< 5)
            .mockReturnValue(10);  // Reroute check (< 20)

        const { rerender, result } = renderHook((props: any) => useNavigationLogic(props), {
            initialProps: { ...defaultProps, mode: Mode.Navigating }
        });

        rerender({
            ...defaultProps,
            mode: Mode.Navigating,
            userLocation: [121.1, 14.1],
        });

        await waitFor(() => {
            expect(result.current.currentStepIndex).toBe(1);
        });
    });

    it('moves through multiple steps sequentially', async () => {
        const multiStepRoute = [{
            legs: [{
                steps: [
                    { geometry: { coordinates: [[120.0, 14.0], [120.1, 14.0]] }, maneuver: { location: [120.0, 14.0] } }, // Step 0
                    { geometry: { coordinates: [[120.1, 14.0], [120.2, 14.0]] }, maneuver: { location: [120.1, 14.0] } }, // Step 1
                    { geometry: { coordinates: [[120.2, 14.0], [120.3, 14.0]] }, maneuver: { location: [120.2, 14.0] } }  // Step 2
                ],
                distance: 1000 // Ensure not < 10 for arrival check
            }],
            geometry: { coordinates: [[120.0, 14.0], [120.3, 14.0]] }
        }];

        const { result, rerender } = renderHook((props: any) => useNavigationLogic(props), {
            initialProps: {
                ...defaultProps,
                mode: Mode.Navigating,
                navigationRoute: multiStepRoute as any,
                userLocation: [120.0, 14.0], // Start at Step 0 start
            }
        });

        // Initial state
        expect(result.current.currentStepIndex).toBe(0);

        // Move to Step 1
        // 1. Arrival Check (> 10)
        // 2. Step Advance Check (< 5)
        (getHaversineDistance as jest.Mock)
            .mockReturnValueOnce(100) // Arrival check (> 10)
            .mockReturnValueOnce(3)   // Step advance check (< 5)
            .mockReturnValue(10); // Fallback

        rerender({
            ...defaultProps,
            mode: Mode.Navigating,
            navigationRoute: multiStepRoute as any,
            userLocation: [120.1, 14.0], // Near start of Step 1
        });

        await waitFor(() => {
            expect(result.current.currentStepIndex).toBe(1);
        });

        // Move to Step 2
        // 1. Arrival Check (> 10)
        // 2. Step Advance Check (< 5)
        (getHaversineDistance as jest.Mock)
            .mockReturnValueOnce(100) // Arrival check (> 10)
            .mockReturnValueOnce(3)   // Step advance check (< 5)
            .mockReturnValue(10); // Fallback

        rerender({
            ...defaultProps,
            mode: Mode.Navigating,
            navigationRoute: multiStepRoute as any,
            userLocation: [120.2, 14.0], // Near start of Step 2
        });

        await waitFor(() => {
            expect(result.current.currentStepIndex).toBe(2);
        });
    });

});

