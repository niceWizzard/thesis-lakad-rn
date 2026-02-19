import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { isValidDate } from '@/src/utils/dateUtils';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Control, useFieldArray } from 'react-hook-form';
import { Platform, Pressable } from 'react-native';

interface OpeningHoursInputProps {
    control: Control<any>;
    name: string;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function OpeningHoursInput({ control, name }: OpeningHoursInputProps) {
    const { fields, update } = useFieldArray({
        control,
        name,
    });

    const [showPicker, setShowPicker] = useState<{ index: number, type: 'open' | 'close' } | null>(null);

    const formatTime = (date?: Date) => {
        if (!date) return '--:--';
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const handleTimeChange = (event: any, selectedDate?: Date) => {
        const currentPicker = showPicker;
        if (Platform.OS === 'android') {
            setShowPicker(null);
        }

        if (currentPicker && selectedDate) {
            const currentField = fields[currentPicker.index] as any;
            if (currentPicker.type === 'open') {
                update(currentPicker.index, { ...currentField, opens_at: selectedDate });
            } else {
                update(currentPicker.index, { ...currentField, closes_at: selectedDate });
            }
        }
    };

    // Initialize fields if empty (should run once if defaultValues are set correctly, but good safety)
    // Actually, react-hook-form should handle initialization via defaultValues.

    return (
        <VStack space="md" className='mb-6'>
            <Heading size="sm" className="uppercase text-typography-500 font-bold mb-2">Opening Hours</Heading>
            <Box className="bg-background-50 rounded-2xl border border-outline-100 overflow-hidden">
                {fields.map((field: any, index) => (
                    <Box key={field.id} className={`p-4 border-b border-outline-50 ${index === fields.length - 1 ? 'border-b-0' : ''}`}>
                        <HStack className="justify-between items-center mb-2">
                            <Text className="font-bold text-typography-700 w-24">{DAYS[field.day_of_week]}</Text>
                            <HStack space="sm" className="items-center">
                                <Text size="xs" className={field.is_closed ? "text-error-600 font-bold" : "text-success-600 font-bold"}>
                                    {field.is_closed ? "CLOSED" : "OPEN"}
                                </Text>
                                <Switch
                                    value={!field.is_closed}
                                    onValueChange={(val) => update(index, { ...field, is_closed: !val })}
                                />
                            </HStack>
                        </HStack>

                        {!field.is_closed && (
                            <HStack space="md" className="justify-end mt-2">
                                <Pressable
                                    onPress={() => setShowPicker({ index, type: 'open' })}
                                    className="bg-background-0 px-3 py-2 rounded-lg border border-outline-200"
                                >
                                    <Text size="xs" className="text-typography-400 mb-1">Opens</Text>
                                    <Text className="font-bold font-mono">{formatTime(field.opens_at)}</Text>
                                </Pressable>
                                <Text className="self-center text-typography-300">-</Text>
                                <Pressable
                                    onPress={() => setShowPicker({ index, type: 'close' })}
                                    className="bg-background-0 px-3 py-2 rounded-lg border border-outline-200"
                                >
                                    <Text size="xs" className="text-typography-400 mb-1">Closes</Text>
                                    <Text className="font-bold font-mono">{formatTime(field.closes_at)}</Text>
                                </Pressable>
                            </HStack>
                        )}
                    </Box>
                ))}
            </Box>

            {showPicker && (
                <RNDateTimePicker
                    value={
                        (showPicker.type === 'open'
                            ? (isValidDate((fields[showPicker.index] as any).opens_at) ? (fields[showPicker.index] as any).opens_at : undefined)
                            : (isValidDate((fields[showPicker.index] as any).closes_at) ? (fields[showPicker.index] as any).closes_at : undefined)) || new Date(new Date().setHours(8, 0, 0, 0))
                    }
                    mode="time"
                    is24Hour={false}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleTimeChange}
                />
            )}
            {/* iOS Modal wrapper could be added here if needed for better UX, but inline/spinner is standard */}
            {Platform.OS === 'ios' && showPicker && (
                <Box className="flex-row justify-end bg-background-100 p-2">
                    <Button size="sm" variant="link" onPress={() => setShowPicker(null)}>
                        <ButtonText>Done</ButtonText>
                    </Button>
                </Box>
            )}

        </VStack>
    );
}
