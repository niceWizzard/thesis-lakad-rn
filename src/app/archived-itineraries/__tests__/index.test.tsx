import { useToastNotification } from '@/src/hooks/useToastNotification';
import { useAuthStore } from '@/src/stores/useAuth';
import { permanentlyDeleteItinerary, restoreItinerary } from '@/src/utils/fetchItineraries';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import ArchivedItinerariesScreen from '../index';

// Mock dependencies
jest.mock('@/src/stores/useAuth');
jest.mock('@/src/hooks/useToastNotification', () => ({
    useToastNotification: jest.fn(() => ({
        showToast: jest.fn(),
    })),
}));
jest.mock('@tanstack/react-query');
jest.mock('@/src/utils/fetchItineraries');
jest.mock('@/src/utils/supabase', () => ({
    supabase: {
        from: jest.fn(),
    },
}));
jest.mock('expo-router', () => ({
    Stack: {
        Screen: () => null,
    },
}));

// Mock UI Components
jest.mock('@/components/ui/box', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { View } = require('react-native');
    return { Box: ({ children, ...props }: any) => <View {...props}>{children}</View> };
});

jest.mock('@/components/ui/button', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { TouchableOpacity, Text } = require('react-native');
    return {
        Button: ({ children, onPress, isDisabled, action, ...props }: any) => (
            <TouchableOpacity onPress={onPress} disabled={isDisabled} testID={action ? `button-${action}` : 'button'} {...props}>
                {children}
            </TouchableOpacity>
        ),
        ButtonIcon: () => null,
        ButtonSpinner: () => <Text>Loading...</Text>,
        ButtonText: ({ children }: any) => <Text>{children}</Text>,
    };
});

jest.mock('@/components/ui/heading', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Text } = require('react-native');
    return { Heading: ({ children }: any) => <Text>{children}</Text> };
});

jest.mock('@/components/ui/hstack', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { View } = require('react-native');
    return { HStack: ({ children }: any) => <View>{children}</View> };
});

jest.mock('@/components/ui/icon', () => {
    return { Icon: () => null };
});

jest.mock('@/components/ui/modal', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { View } = require('react-native');
    return {
        Modal: ({ isOpen, children }: any) => isOpen ? <View testID="modal">{children}</View> : null,
        ModalBackdrop: () => null,
        ModalBody: ({ children }: any) => <View>{children}</View>,
        ModalContent: ({ children }: any) => <View>{children}</View>,
        ModalFooter: ({ children }: any) => <View>{children}</View>,
        ModalHeader: ({ children }: any) => <View>{children}</View>,
    };
});

jest.mock('@/components/ui/progress', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { View } = require('react-native');
    return {
        Progress: ({ children }: any) => <View>{children}</View>,
        ProgressFilledTrack: () => null,
    };
});

jest.mock('@/components/ui/text', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Text } = require('react-native');
    return { Text: ({ children }: any) => <Text>{children}</Text> };
});

jest.mock('@/components/ui/vstack', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { View } = require('react-native');
    return { VStack: ({ children }: any) => <View>{children}</View> };
});

jest.mock('@/src/components/ItinerarySkeleton', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { View } = require('react-native');
    const comp = () => <View testID="itinerary-skeleton" />;
    comp.displayName = 'ItinerarySkeleton';
    return comp;
});


describe('ArchivedItinerariesScreen', () => {
    const mockShowToast = jest.fn();
    const mockRefetch = jest.fn();
    const mockInvalidateQueries = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        (useAuthStore as unknown as jest.Mock).mockReturnValue({
            session: { user: { id: 'test-user-id' } },
        });

        (useToastNotification as unknown as jest.Mock).mockReturnValue({
            showToast: mockShowToast,
        });

        (useQueryClient as unknown as jest.Mock).mockReturnValue({
            invalidateQueries: mockInvalidateQueries,
        });
    });

    it('renders "No Archived Trips" when list is empty', () => {
        (useQuery as unknown as jest.Mock).mockReturnValue({
            data: [],
            isLoading: false,
            isRefetching: false,
            refetch: mockRefetch,
        });

        render(<ArchivedItinerariesScreen />);

        expect(screen.getByText('No Archived Trips')).toBeTruthy();
        expect(screen.getByText('Your deleted itineraries will show up here.')).toBeTruthy();
    });

    it('renders list of itineraries when data is present', () => {
        const mockItineraries = [
            { id: 1, name: 'Trip 1', stops: [], distance: 1000, deleted_at: new Date().toISOString() },
            { id: 2, name: 'Trip 2', stops: [], distance: 2000, deleted_at: new Date().toISOString() },
        ];

        (useQuery as unknown as jest.Mock).mockReturnValue({
            data: mockItineraries,
            isLoading: false,
            isRefetching: false,
            refetch: mockRefetch,
        });

        render(<ArchivedItinerariesScreen />);

        expect(screen.getByText('Trip 1')).toBeTruthy();
        expect(screen.getByText('Trip 2')).toBeTruthy();
        expect(screen.getByText(/Auto-deletion Notice/)).toBeTruthy();
    });

    it('renders the "Auto-deletion Notice" with correct text', () => {
        (useQuery as unknown as jest.Mock).mockReturnValue({
            data: [{ id: 1, name: 'Trip 1', stops: [], distance: 1000, deleted_at: new Date().toISOString() }],
            isLoading: false,
            isRefetching: false,
            refetch: mockRefetch,
        });

        render(<ArchivedItinerariesScreen />);

        expect(screen.getByText(/permanently deleted 7 days after/)).toBeTruthy();
    });

    it('opens confirmation modal when "Delete All" is pressed', () => {
        (useQuery as unknown as jest.Mock).mockReturnValue({
            data: [{ id: 1, name: 'Trip 1', stops: [], distance: 1000, deleted_at: new Date().toISOString() }],
            isLoading: false,
            isRefetching: false,
            refetch: mockRefetch,
        });

        render(<ArchivedItinerariesScreen />);

        fireEvent.press(screen.getByText('Delete All'));

        expect(screen.getByText('Delete All Archived Itineraries?')).toBeTruthy();
    });

    it('opens confirmation modal when "Delete Forever" is pressed', () => {
        const mockItinerary = { id: 1, name: 'Trip 1', stops: [], distance: 1000, deleted_at: new Date().toISOString() };
        (useQuery as unknown as jest.Mock).mockReturnValue({
            data: [mockItinerary],
            isLoading: false,
            isRefetching: false,
            refetch: mockRefetch,
        });

        render(<ArchivedItinerariesScreen />);

        const deleteButtons = screen.getAllByText('Delete Forever');
        fireEvent.press(deleteButtons[0]);

        expect(screen.getByText('Confirm Permanent Delete')).toBeTruthy();
    });

    it('calls restoreItinerary when "Restore" is pressed', async () => {
        const mockItinerary = { id: 1, name: 'Trip 1', stops: [], distance: 1000, deleted_at: new Date().toISOString() };
        (useQuery as unknown as jest.Mock).mockReturnValue({
            data: [mockItinerary],
            isLoading: false,
            isRefetching: false,
            refetch: mockRefetch,
        });

        (restoreItinerary as unknown as jest.Mock).mockResolvedValue({});

        render(<ArchivedItinerariesScreen />);

        fireEvent.press(screen.getByText('Restore'));

        await waitFor(() => {
            expect(restoreItinerary).toHaveBeenCalledWith(1);
            expect(mockShowToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Itinerary restored" }));
            expect(mockRefetch).toHaveBeenCalled();
        });
    });

    it('calls permanentlyDeleteItinerary for items older than 7 days', async () => {
        const oldDate = new Date();
        oldDate.setDate(oldDate.getDate() - 8); // 8 days ago

        const mockItinerary = { id: 1, name: 'Old Trip', stops: [], distance: 1000, deleted_at: oldDate.toISOString() };

        (useQuery as unknown as jest.Mock).mockReturnValue({
            data: [mockItinerary],
            isLoading: false,
            isRefetching: false,
            refetch: mockRefetch,
        });

        render(<ArchivedItinerariesScreen />);

        await waitFor(() => {
            expect(permanentlyDeleteItinerary).toHaveBeenCalledWith(1);
        });
    });
});
