import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { CloseIcon, Icon } from '@/components/ui/icon';
import {
    Modal,
    ModalBackdrop,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader
} from '@/components/ui/modal';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import React, { useEffect, useState } from 'react';
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, View } from 'react-native';

interface EditDurationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (duration: number) => void;
    initialDuration?: number;
    stopName: string;
}

const ITEM_HEIGHT = 44;

interface WheelPickerProps {
    items: number[];
    selectedValue: number;
    onValueChange: (value: number) => void;
}

const WheelPicker = ({ items, selectedValue, onValueChange }: WheelPickerProps) => {
    const REPEATS = 200;

    // Create the multiplied array exactly once (or when items change)
    const repeatedItems = React.useMemo(() => {
        const arr = [];
        for (let i = 0; i < REPEATS; i++) {
            arr.push(...items);
        }
        return arr;
    }, [items]);

    const paddedItems = React.useMemo(() => ['', ...repeatedItems, ''], [repeatedItems]);
    const snapOffsets = React.useMemo(() => repeatedItems.map((_, i) => i * ITEM_HEIGHT), [repeatedItems]);

    const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const index = Math.round(offsetY / ITEM_HEIGHT);
        if (repeatedItems[index] !== undefined) {
            onValueChange(repeatedItems[index]);
        }
    };

    const selectedIndex = items.indexOf(selectedValue);
    const baseIndex = selectedIndex >= 0 ? selectedIndex : 0;
    const defaultIndex = Math.floor(REPEATS / 2) * items.length + baseIndex;

    return (
        <View style={{ height: ITEM_HEIGHT * 3, overflow: 'hidden', width: '100%' }}>
            <FlatList
                data={paddedItems}
                keyExtractor={(item, index) => `${item}-${index}`}
                showsVerticalScrollIndicator={false}
                snapToOffsets={snapOffsets}
                decelerationRate="fast"
                onMomentumScrollEnd={handleScrollEnd}
                onScrollEndDrag={(e) => {
                    const velocityY = e.nativeEvent.velocity?.y ?? 0;
                    if (Math.abs(velocityY) < 0.1) {
                        handleScrollEnd(e);
                    }
                }}
                initialScrollIndex={defaultIndex}
                getItemLayout={(_, index) => ({
                    length: ITEM_HEIGHT,
                    offset: ITEM_HEIGHT * index,
                    index,
                })}
                renderItem={({ item }) => {
                    const isSelected = item === selectedValue;
                    return (
                        <View style={{ height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' }}>
                            <Text
                                size={isSelected ? 'xl' : 'md'}
                                className={isSelected ? 'text-typography-950 font-bold' : 'text-typography-400'}
                                allowFontScaling={false}
                            >
                                {item !== '' ? String(item).padStart(2, '0') : ''}
                            </Text>
                        </View>
                    );
                }}
            />
            {/* Selection highlight overlay */}
            <View
                className="absolute top-[44px] left-0 right-0 h-[44px] border-y border-outline-200 pointer-events-none"
            />
        </View>
    );
};

export function EditDurationModal({
    isOpen,
    onClose,
    onSave,
    initialDuration = 60,
    stopName
}: EditDurationModalProps) {
    const [hours, setHours] = useState(1);
    const [minutes, setMinutes] = useState(0);

    const hoursData = Array.from({ length: 24 }, (_, i) => i);
    const minutesData = Array.from({ length: 60 }, (_, i) => i);

    useEffect(() => {
        if (isOpen) {
            setHours(Math.floor((initialDuration || 60) / 60));
            setMinutes((initialDuration || 60) % 60);
        }
    }, [initialDuration, isOpen]);

    const handleSave = () => {
        const totalMinutes = hours * 60 + minutes;
        if (totalMinutes >= 0) {
            onSave(totalMinutes);
            onClose();
        } else {
            onSave(0);
            onClose();
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="md"
        >
            <ModalBackdrop />
            <ModalContent className="max-w-[400px] rounded-3xl">
                <ModalHeader>
                    <Heading size="lg">Edit Visit Duration</Heading>
                    <ModalCloseButton onPress={onClose}>
                        <Icon as={CloseIcon} />
                    </ModalCloseButton>
                </ModalHeader>
                <View className="mt-2 mb-6">
                    <Text size="md" className="mb-6 mt-2 text-center text-typography-500">
                        Set the time you plan to spend at {stopName}.
                    </Text>
                    <HStack space="md" className="items-center justify-center mb-4">
                        <VStack space="xs" className="flex-1 items-center">
                            <Text size="sm" className="text-center font-bold mb-2">Hours</Text>
                            <WheelPicker
                                items={hoursData}
                                selectedValue={hours}
                                onValueChange={setHours}
                            />
                        </VStack>
                        <Heading size="xl" className="mt-8">:</Heading>
                        <VStack space="xs" className="flex-1 items-center">
                            <Text size="sm" className="text-center font-bold mb-2">Minutes</Text>
                            <WheelPicker
                                items={minutesData}
                                selectedValue={minutes}
                                onValueChange={setMinutes}
                            />
                        </VStack>
                    </HStack>
                </View>
                <ModalFooter>
                    <Button
                        variant="outline"
                        action="secondary"
                        onPress={onClose}
                        className="flex-1 rounded-xl"
                    >
                        <ButtonText>Cancel</ButtonText>
                    </Button>
                    <Button action="primary" onPress={handleSave} className="flex-1 rounded-xl">
                        <ButtonText>Save</ButtonText>
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
