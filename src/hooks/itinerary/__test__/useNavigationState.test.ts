import { act, renderHook } from '@testing-library/react-native';
import { Mode, useNavigationState } from '../useNavigationState';

// Mock requestAnimationFrame
global.requestAnimationFrame = (cb) => {
    cb(0);
    return 0;
};

describe('useNavigationState', () => {
    const mockCamera = {
        setCamera: jest.fn(),
    };

    const mockBottomSheet = {
        snapToIndex: jest.fn(),
        close: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('initializes with default state', () => {
        const { result } = renderHook(() => useNavigationState(null));

        expect(result.current.mode).toBe(Mode.Viewing);
        expect(result.current.isSheetOpen).toBe(true);
        expect(result.current.navigationRoute).toEqual([]);
        expect(result.current.navigationProfile).toBe('driving');
        expect(result.current.avoidTolls).toBe(false);
    });

    it('switchMode to Navigating updates state', () => {
        const { result } = renderHook(() => useNavigationState(null));

        act(() => {
            result.current.switchMode(Mode.Navigating);
        });

        expect(result.current.mode).toBe(Mode.Navigating);
        expect(result.current.isSheetOpen).toBe(true);
    });

    it('switchMode to Viewing resets state and moves camera', () => {
        const userLocation: [number, number] = [121.0, 14.0];
        const { result } = renderHook(() => useNavigationState(userLocation));

        // Inject mock camera
        // @ts-ignore - writing to readonly ref for test
        result.current.cameraRef.current = mockCamera;

        // First switch to navigating so we can switch back
        act(() => {
            result.current.switchMode(Mode.Navigating);
        });

        // Set some route
        act(() => {
            result.current.setNavigationRoute([{} as any]);
        });

        // Switch back to Viewing
        act(() => {
            result.current.switchMode(Mode.Viewing);
        });

        expect(result.current.mode).toBe(Mode.Viewing);
        expect(result.current.isSheetOpen).toBe(true);
        expect(result.current.navigationRoute).toEqual([]); // Should be cleared

        expect(mockCamera.setCamera).toHaveBeenCalledWith({
            centerCoordinate: userLocation,
            zoomLevel: 14,
            animationDuration: 400,
            pitch: 0,
            heading: 0
        });
    });

    it('locatePOI moves camera to location', () => {
        const { result } = renderHook(() => useNavigationState(null));

        // @ts-ignore
        result.current.cameraRef.current = mockCamera;

        act(() => {
            result.current.locatePOI(120.5, 15.5);
        });

        expect(mockCamera.setCamera).toHaveBeenCalledWith({
            centerCoordinate: [120.5, 15.5],
            zoomLevel: 18,
            animationDuration: 800,
            padding: expect.any(Object)
        });
    });

    it('updates bottom sheet when isSheetOpen changes', () => {
        const { result } = renderHook(() => useNavigationState(null));

        // @ts-ignore
        result.current.bottomSheetRef.current = mockBottomSheet;

        // Initially open (from mount) - typically ref is null on mount so effect creates no call on mount unless we render again? 
        // Or if we attach ref and trigger effect.

        // Close it
        act(() => {
            result.current.setIsSheetOpen(false);
        });

        expect(mockBottomSheet.close).toHaveBeenCalled();

        // Open it
        act(() => {
            result.current.setIsSheetOpen(true);
        });

        expect(mockBottomSheet.snapToIndex).toHaveBeenCalledWith(0);
    });
});
