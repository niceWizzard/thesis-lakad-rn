import { formatDate } from '../../format/date';

describe('formatDate', () => {
    it('formats date correctly', () => {
        // We use a fixed date string. 
        // Note: The output depends on the runtime locale and timezone. 
        // However, 'en-US' locale is specified in the implementation.
        // We check for key components of the expected date string.
        const dateString = '2023-10-05T14:30:00.000Z';
        const result = formatDate(dateString);

        // Expect parts of the date to be present
        expect(result).toMatch(/Oct/);
        expect(result).toMatch(/5/);
        expect(result).toMatch(/2023/);
    });

    it('handles different dates', () => {
        const dateString = '2024-01-01T00:00:00.000Z';
        const result = formatDate(dateString);
        expect(result).toMatch(/Jan/);
        expect(result).toMatch(/1/);
        expect(result).toMatch(/2024/);
    });
});
