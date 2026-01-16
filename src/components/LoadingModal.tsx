import { Modal, ModalBackdrop, ModalContent } from '@/components/ui/modal'
import { Spinner } from '@/components/ui/spinner'
import { VStack } from '@/components/ui/vstack'
import React from 'react'
import { ColorValue, Text } from 'react-native'

const LoadingModal = ({
    isShown,
    loadingText,
    spinnerColor
}: {
    isShown: boolean,
    loadingText?: string
    spinnerColor?: ColorValue
}) => {
    return (
        <Modal isOpen={isShown} closeOnOverlayClick={false}>
            <ModalBackdrop />
            <ModalContent className="p-8 items-center justify-center rounded-2xl w-auto">
                <VStack space="md" className="items-center">
                    <Spinner size="large" color={spinnerColor ?? "primary"} />
                    <Text className="font-medium text-typography-700">{loadingText ?? 'Loading...'}</Text>
                </VStack>
            </ModalContent>
        </Modal>
    )
}

export default LoadingModal