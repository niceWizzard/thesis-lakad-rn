import { Actionsheet, ActionsheetBackdrop, ActionsheetContent, ActionsheetDragIndicator, ActionsheetDragIndicatorWrapper, ActionsheetItem, ActionsheetItemText } from '@/components/ui/actionsheet';
import { Box } from '@/components/ui/box';
import { Fab, FabIcon, FabLabel } from '@/components/ui/fab';
import { Heading } from '@/components/ui/heading';
import { Icon } from '@/components/ui/icon';
import { useRouter } from 'expo-router';
import { Plus, Wand2 } from 'lucide-react-native';
import React, { useState } from 'react';


const ExpandableFab = () => {
    const [showMenu, setShowMenu] = useState(false);
    const router = useRouter();

    const handleClose = () => setShowMenu(false);

    const handleManual = () => {

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
            <Actionsheet isOpen={showMenu} onClose={handleClose} >
                <ActionsheetBackdrop />
                <ActionsheetContent>
                    <ActionsheetDragIndicatorWrapper>
                        <ActionsheetDragIndicator />
                    </ActionsheetDragIndicatorWrapper>
                    <Box>
                        <Heading>Create an Itinerary</Heading>
                    </Box>
                    <ActionsheetItem onPress={handleManual}>
                        <Icon as={Plus} />
                        <ActionsheetItemText>Create manually</ActionsheetItemText>
                    </ActionsheetItem>

                    <ActionsheetItem onPress={handleSmartGenerate}>
                        <Icon as={Wand2} />
                        <ActionsheetItemText>Smart Generate</ActionsheetItemText>
                    </ActionsheetItem>

                </ActionsheetContent>
            </Actionsheet>
        </>
    );
};

export default ExpandableFab;