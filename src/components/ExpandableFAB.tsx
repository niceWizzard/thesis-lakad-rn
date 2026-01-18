import { Actionsheet, ActionsheetBackdrop, ActionsheetContent, ActionsheetDragIndicator, ActionsheetDragIndicatorWrapper, ActionsheetItem, ActionsheetItemText } from '@/components/ui/actionsheet';
import { Box } from '@/components/ui/box';
import { Fab, FabIcon, FabLabel } from '@/components/ui/fab';
import { Heading } from '@/components/ui/heading';
import { Icon } from '@/components/ui/icon';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Plus, Wand2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { useAuthStore } from '../stores/useAuth';
import { createItineraryOnly } from '../utils/fetchItineraries';


const ExpandableFab = () => {
    const [showMenu, setShowMenu] = useState(false);
    const router = useRouter();
    const { session } = useAuthStore()
    const queryClient = useQueryClient()

    const handleClose = () => setShowMenu(false);

    const handleManual = async () => {
        try {
            const id = await createItineraryOnly({
                userId: session!.user.id,
                distance: 0,
            })
            await queryClient.invalidateQueries({ queryKey: ['itineraries'] })
            router.navigate({
                pathname: '/itinerary/[id]',
                params: { id }
            })
        } catch (e) {
            console.error(e)
        } finally {
            handleClose()
        }
    }

    const handleSmartGenerate = () => {
        handleClose()
        router.navigate('/itinerary/agam')
    }

    return (
        <>
            {/* The Floating Action Button */}
            <Fab
                size="lg"
                placement="bottom right"
                onPress={() => setShowMenu(true)}
            >
                <FabIcon as={Plus} />
                <FabLabel>New</FabLabel>
            </Fab>

            {/* The Menu (Actionsheet) */}
            <Actionsheet isOpen={showMenu} onClose={handleClose} snapPoints={[30]}  >
                <ActionsheetBackdrop />
                <ActionsheetContent className='max-h-[50%]'>
                    <ActionsheetDragIndicatorWrapper>
                        <ActionsheetDragIndicator />
                    </ActionsheetDragIndicatorWrapper>
                    <Box className='mb-4'>
                        <Heading>Create an Itinerary</Heading>
                    </Box>
                    <ActionsheetItem onPress={handleManual}>
                        <Icon as={Plus} size='lg' />
                        <ActionsheetItemText size='lg'>Create manually</ActionsheetItemText>
                    </ActionsheetItem>

                    <ActionsheetItem onPress={handleSmartGenerate}>
                        <Icon as={Wand2} size='lg' />
                        <ActionsheetItemText size='lg'>Smart Generate</ActionsheetItemText>
                    </ActionsheetItem>

                </ActionsheetContent>
            </Actionsheet>
        </>
    );
};

export default ExpandableFab;