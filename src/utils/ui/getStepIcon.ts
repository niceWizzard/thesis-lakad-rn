import {
    ArrowUp,
    ArrowUpLeft,
    ArrowUpRight,
    MapPin,
    RotateCcw
} from 'lucide-react-native';

/**
 * Returns the appropriate Lucide icon component based on the navigation instruction text.
 *
 * It performs a case-insensitive check for keywords like 'left', 'right', 'u-turn', 'destination', etc.
 *
 * @param instruction - The navigation instruction string (e.g., "Turn left onto Main St").
 * @returns The Lucide icon component.
 */
export const getStepIcon = (instruction: string) => {
    const text = instruction.toLowerCase();

    if (text.includes('left')) return ArrowUpLeft;
    if (text.includes('right')) return ArrowUpRight;
    if (text.includes('u-turn')) return RotateCcw;
    if (text.includes('destination') || text.includes('arrive')) return MapPin;

    // Default to straight arrow
    return ArrowUp;
};
