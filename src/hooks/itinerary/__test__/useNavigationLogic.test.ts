import { useToastNotification } from '@/src/hooks/useToastNotification';
import { fetchDirections } from '@/src/utils/navigation/fetchDirections';
import { act, renderHook } from '@testing-library/react-native';
import { useNavigationLogic } from '../useNavigationLogic';
import { Mode } from '../useNavigationState';

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
    useFocusEffect: (cb: any) => cb(),
}));


jest.mock('@tanstack/react-query', () => ({
    useQueryClient: jest.fn(() => ({
        invalidateQueries: jest.fn(),
    })),
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
        navigationRoute: [],
        setNavigationRoute: mockSetNavigationRoute,
        switchMode: mockSwitchMode,
        nextUnvisitedStop: {
            id: '1',
            landmark: { longitude: 120.1, latitude: 14.1 }
        } as any,
        refetchItinerary: mockRefetchItinerary,
        commercials: [],
        cameraRef: { current: mockCamera } as any,
        navigationProfile: 'driving' as const,
        avoidTolls: false,
    };

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

    it('startNavigation handles error', async () => {
        (fetchDirections as jest.Mock).mockRejectedValue(new Error('Fetch failed'));

        const { result } = renderHook(() => useNavigationLogic(defaultProps));

        await act(async () => {
            await result.current.startNavigation();
        });

        expect(mockShowToast).toHaveBeenCalledWith(expect.objectContaining({
            title: "Error starting navigation",
            action: "error"
        }));
    });
});
