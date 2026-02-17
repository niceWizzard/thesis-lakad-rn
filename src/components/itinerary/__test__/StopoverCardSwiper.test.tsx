import { supabase } from '@/src/utils/supabase';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Image } from 'react-native';
import StopoverCardSwiper from '../StopoverCardSwiper';

// Setup chaining mocks
const mockEq = jest.fn(); // eq returns Promise
const mockDelete = jest.fn(() => ({ eq: mockEq }));
const mockFrom = jest.fn(() => ({ delete: mockDelete }));

// Mock Dependencies
jest.mock('@/src/utils/supabase', () => ({
    supabase: {
        from: jest.fn(), // Will link this to mockFrom in beforeEach
    },
}));

jest.mock('@/src/hooks/useToastNotification', () => ({
    useToastNotification: jest.fn(() => ({
        showToast: jest.fn(),
    })),
}));

// Mock UI Components
jest.mock('@/components/ui/button', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Text } = require('react-native');
    return {
        Button: ({ children, onPress, action }: any) => (
            <Text testID={`button-${action}`} onPress={onPress}>{children}</Text>
        ),
        ButtonIcon: () => null,
    };
});

// Simple Mocks for other UI
jest.mock('@/components/ui/center', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { View } = require('react-native');
    return { Center: ({ children }: any) => <View>{children}</View> };
});
jest.mock('@/components/ui/hstack', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { View } = require('react-native');
    return { HStack: ({ children }: any) => <View>{children}</View> };
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

// Mock Child Component (Updated to aid queries)
jest.mock('../StopOverCard', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { View, Text } = require('react-native');
    const Comp = ({ stop }: any) => (
        <View testID="stop-over-card">
            <Text>{stop.landmark.name}</Text>
        </View>
    );
    Comp.displayName = 'StopOverCard';
    return Comp;
});

// Mock Reanimated
jest.mock('react-native-reanimated', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Reanimated = require('react-native-reanimated/mock');
    Reanimated.default.call = () => { };
    return {
        ...Reanimated,
        useSharedValue: jest.fn((val) => ({ value: val })),
        useAnimatedStyle: jest.fn(() => ({})),
        withTiming: jest.fn((toValue, config, callback) => {
            if (callback) callback(true);
            return { value: toValue };
        }),
        runOnJS: jest.fn((fn) => fn),
    };
});

// Mock Gesture Handler
jest.mock('react-native-gesture-handler', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { View } = require('react-native');
    return {
        GestureDetector: ({ children }: any) => children,
        Gesture: {
            Pan: () => ({
                onUpdate: jest.fn().mockReturnThis(),
                onEnd: jest.fn().mockReturnThis(),
                onFinalize: jest.fn().mockReturnThis(),
            }),
        },
    };
});


describe('StopoverCardSwiper', () => {
    const mockStops = [
        { id: '1', landmark: { id: 'l1', name: 'Stop 1', description: 'Desc 1', type: 'Type 1', image_url: 'url1', district: 'D1', municipality: 'M1', lat: 0, long: 0 } },
        { id: '2', landmark: { id: 'l2', name: 'Stop 2', description: 'Desc 2', type: 'Type 2', image_url: 'url2', district: 'D2', municipality: 'M2', lat: 0, long: 0 } }
    ];

    const mockOnClose = jest.fn();
    const mockRefetch = jest.fn();
    const mockShowToast = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        mockFrom.mockClear();
        mockDelete.mockClear();
        mockEq.mockClear();

        // Link the mock
        (supabase.from as jest.Mock).mockImplementation(mockFrom);

        // Mock Image.prefetch
        jest.spyOn(Image, 'prefetch').mockImplementation(() => Promise.resolve(true));
    });

    it('renders correctly', () => {
        render(
            <StopoverCardSwiper
                onClose={mockOnClose}
                refetch={mockRefetch}
                showToast={mockShowToast}
                stops={mockStops as any}
            />
        );
        expect(screen.getByText('Stop 1')).toBeTruthy();
        expect(screen.getByText('1 / 2')).toBeTruthy();
    });

    it('handles swipe right (keep)', async () => {
        render(
            <StopoverCardSwiper
                onClose={mockOnClose}
                refetch={mockRefetch}
                showToast={mockShowToast}
                stops={mockStops as any}
            />
        );

        const button = screen.getByTestId('button-primary');
        fireEvent.press(button);

        await waitFor(() => {
            expect(screen.getByText('2 / 2')).toBeTruthy();
            expect(screen.getByText('Stop 2')).toBeTruthy();
            expect(mockFrom).not.toHaveBeenCalled();
        });
    });

    it('handles swipe left (remove)', async () => {
        render(
            <StopoverCardSwiper
                onClose={mockOnClose}
                refetch={mockRefetch}
                showToast={mockShowToast}
                stops={mockStops as any}
            />
        );

        // Configure Success Response
        mockEq.mockResolvedValue({ error: null });

        const button = screen.getByTestId('button-negative');
        fireEvent.press(button);

        await waitFor(() => {
            expect(mockFrom).toHaveBeenCalledWith('stops');
            expect(mockDelete).toHaveBeenCalled();
            expect(mockEq).toHaveBeenCalledWith('id', '1');

            // Check if index incremented
            expect(screen.getByText('2 / 2')).toBeTruthy();
        });
    });

    it('shows end of stops message', async () => {
        render(
            <StopoverCardSwiper
                onClose={mockOnClose}
                refetch={mockRefetch}
                showToast={mockShowToast}
                stops={[mockStops[0]] as any}
            />
        );

        const button = screen.getByTestId('button-primary');
        fireEvent.press(button);

        await waitFor(() => {
            expect(screen.getByText('All stops swiped')).toBeTruthy();
        });
    });
});
