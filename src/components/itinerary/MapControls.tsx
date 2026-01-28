import { ArrowUp, LocateFixed } from 'lucide-react-native';
import React from 'react';

import { Button, ButtonIcon } from '@/components/ui/button';
import { VStack } from '@/components/ui/vstack';

interface MapControlsProps {
    isSheetOpen: boolean;
    onOpenSheet: () => void;
    onLocateMe: () => void;
}

export function MapControls({ isSheetOpen, onOpenSheet, onLocateMe }: MapControlsProps) {
    return (
        <VStack space='md' className='absolute bottom-6 right-4 z-[5] items-end'>
            {!isSheetOpen && (
                <Button className='rounded-full w-14 h-14 shadow-lg' onPress={onOpenSheet}>
                    <ButtonIcon as={ArrowUp} size='lg' />
                </Button>
            )}
            <Button className='rounded-full w-14 h-14 shadow-lg' onPress={onLocateMe}>
                <ButtonIcon as={LocateFixed} className='text-primary-600' size='lg' />
            </Button>
        </VStack>
    );
}
