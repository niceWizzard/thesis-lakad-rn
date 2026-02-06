import { useToast } from '@/components/ui/toast';
import { act, renderHook } from '@testing-library/react-native';
import { useToastNotification } from '../useToastNotification';

// Mock dependencies
jest.mock('@/components/ui/toast', () => ({
    useToast: jest.fn(),
    Toast: jest.fn(({ children }) => children),
    ToastTitle: jest.fn(({ children }) => children),
    ToastDescription: jest.fn(({ children }) => children),
}));

jest.mock('lucide-react-native', () => ({
    AlertCircle: jest.fn(() => null),
    CheckCircle2: jest.fn(() => null),
    Info: jest.fn(() => null),
}));

describe('useToastNotification', () => {
    const mockShow = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useToast as jest.Mock).mockReturnValue({
            show: mockShow,
            id: 'mock-id',
        });
    });

    it('returns toast object properties', () => {
        const { result } = renderHook(() => useToastNotification());
        expect(result.current.show).toBeDefined();
        expect(result.current.showToast).toBeDefined();
    });

    it('showToast calls toast.show with correct default parameters', () => {
        const { result } = renderHook(() => useToastNotification());

        act(() => {
            result.current.showToast({ title: 'Success Title' });
        });

        expect(mockShow).toHaveBeenCalledTimes(1);
        expect(mockShow).toHaveBeenCalledWith(expect.objectContaining({
            placement: 'bottom',
            duration: 2000,
            render: expect.any(Function),
        }));
    });

    it('showToast handles description', () => {
        const { result } = renderHook(() => useToastNotification());

        act(() => {
            result.current.showToast({ title: 'Title', description: 'Desc', action: 'info' });
        });

        expect(mockShow).toHaveBeenCalled();
    });
});
