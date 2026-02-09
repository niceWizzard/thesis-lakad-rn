import {
    AlertDialog,
    AlertDialogBackdrop,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
} from '@/components/ui/alert-dialog';
import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import React from 'react';

interface ImageCreditModalProps {
    isOpen: boolean;
    onClose: () => void;
    credits?: string | null;
}

const ImageCreditModal: React.FC<ImageCreditModalProps> = ({ isOpen, onClose, credits }) => {
    return (
        <AlertDialog isOpen={isOpen} onClose={onClose} size="md">
            <AlertDialogBackdrop />
            <AlertDialogContent className="rounded-[24px]">
                <AlertDialogHeader className="border-b border-outline-50 p-4">
                    <Heading size="md" className="text-typography-900">Image Credits</Heading>
                </AlertDialogHeader>
                <AlertDialogBody className="p-4">
                    <VStack space="sm">
                        <Text size="sm" className="text-typography-600">
                            The images used in this application are for educational and illustrative purposes only.
                        </Text>
                        <Text size="sm" className="text-typography-600">
                            Credits to the respective owners. We do not claim ownership of these images.
                        </Text>
                        {
                            credits && (
                                <Text size="sm" className="text-typography-600">
                                    From: {credits}
                                </Text>
                            )
                        }
                    </VStack>
                </AlertDialogBody>
                <AlertDialogFooter className="p-4 border-t border-outline-50">
                    <Button
                        variant="outline"
                        action="secondary"
                        onPress={onClose}
                        size="sm"
                        className="rounded-xl w-full"
                    >
                        <ButtonText>Close</ButtonText>
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default ImageCreditModal;
