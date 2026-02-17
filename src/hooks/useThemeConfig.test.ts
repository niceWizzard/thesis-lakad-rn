import { renderHook } from '@testing-library/react-native';
import useThemeConfig from './useThemeConfig';

// Mock nativewind
jest.mock('nativewind', () => ({
    useColorScheme: jest.fn(),
    vars: jest.fn((v) => v), // Mock vars to just return the input
}));

import { useColorScheme } from 'nativewind';

describe('useThemeConfig', () => {
    it('should return parsed light theme vars when colorScheme is light', () => {
        (useColorScheme as jest.Mock).mockReturnValue({ colorScheme: 'light' });

        const { result } = renderHook(() => useThemeConfig());

        // Check a few known values from config.ts
        // '--color-primary-500': '16 185 129'
        expect(result.current.primary['500']).toBe('rgb(16, 185, 129)');

        // '--color-secondary-0': '255 255 255'
        expect(result.current.secondary['0']).toBe('rgb(255, 255, 255)');
    });

    it('should return parsed dark theme vars when colorScheme is dark', () => {
        (useColorScheme as jest.Mock).mockReturnValue({ colorScheme: 'dark' });

        const { result } = renderHook(() => useThemeConfig());

        // Check a few known values from config.ts for dark mode
        // '--color-primary-0': '2 44 34'
        expect(result.current.primary['0']).toBe('rgb(2, 44, 34)');

        // '--color-background-0': '18 18 18'
        expect(result.current.background['0']).toBe('rgb(18, 18, 18)');
    });
});
