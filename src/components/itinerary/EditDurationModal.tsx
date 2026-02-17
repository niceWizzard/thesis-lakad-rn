import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Input, InputField } from '@/components/ui/input';
import { Modal, ModalBackdrop, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@/components/ui/modal';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import React, { useEffect, useState } from 'react';

interface EditDurationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (duration: number) => void;
    initialDuration?: number;
    stopName: string;
}

export function EditDurationModal({
    isOpen,
    onClose,
    onSave,
    initialDuration = 60,
    stopName
}: EditDurationModalProps) {
    const [duration, setDuration] = useState(initialDuration.toString());

    useEffect(() => {
        setDuration(initialDuration?.toString() || "60");
    }, [initialDuration, isOpen]);

    const handleSave = () => {
        const parsed = parseInt(duration, 10);
        if (!isNaN(parsed) && parsed >= 0) {
            onSave(parsed);
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalBackdrop />
            <ModalContent>
                <ModalHeader>
                    <Heading size="lg" className="text-typography-900">
                        Edit Visit Duration
                    </Heading>
                </ModalHeader>
                <ModalBody>
                    <VStack space="md">
                        <Text size="md" className="text-typography-500">
                            Set the expected duration for your visit to <Text className="font-bold">{stopName}</Text>.
                        </Text>
                        <VStack space="xs">
                            <Text size="sm" className="text-typography-500 font-medium">
                                Duration (minutes)
                            </Text>
                            <Input>
                                <InputField
                                    keyboardType="numeric"
                                    value={duration}
                                    onChangeText={setDuration}
                                    placeholder="60"
                                />
                            </Input>
                        </VStack>
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <HStack space="md" className="justify-end">
                        <Button variant="outline" action="secondary" onPress={onClose}>
                            <ButtonText>Cancel</ButtonText>
                        </Button>
                        <Button onPress={handleSave}>
                            <ButtonText>Save</ButtonText>
                        </Button>
                    </HStack>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
