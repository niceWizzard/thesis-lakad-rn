import { Actionsheet, ActionsheetBackdrop, ActionsheetContent, ActionsheetDragIndicator, ActionsheetDragIndicatorWrapper, ActionsheetItem, ActionsheetItemText } from '@/components/ui/actionsheet';
import { Box } from '@/components/ui/box';
import { Fab, FabIcon } from '@/components/ui/fab';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { StyleURL } from '@rnmapbox/maps';
import { Check, Layers, LocateFixed } from 'lucide-react-native';
import React, { useState } from 'react';


const MAP_STYLES = [
    { name: 'Dark', url: StyleURL.Dark },
    { name: 'Satellite', url: StyleURL.Satellite },
    { name: 'Satellite Street', url: StyleURL.SatelliteStreet },
    { name: 'Street', url: StyleURL.Street },
]

const MapFabs = ({
    handleLocatePress,
    setMapStyle,
    mapStyle,
}: {
    handleLocatePress: () => void,
    setMapStyle: React.Dispatch<React.SetStateAction<StyleURL>>
    mapStyle: StyleURL
}) => {
    const [showActionsheet, setShowActionsheet] = useState(false)

    return (
        <>
            <Fab
                onPress={() => setShowActionsheet(true)}
                size="md"
                placement='top right'
                className='mt-40'
            >
                <FabIcon as={Layers} className="text-typography-700" />
            </Fab>
            <Fab
                onPress={handleLocatePress}
                size="lg"
                placement='bottom right'
            >
                <FabIcon as={LocateFixed} />
            </Fab>

            <Actionsheet isOpen={showActionsheet} onClose={() => setShowActionsheet(false)}>
                <ActionsheetBackdrop />
                <ActionsheetContent>
                    <ActionsheetDragIndicatorWrapper>
                        <ActionsheetDragIndicator />
                    </ActionsheetDragIndicatorWrapper>
                    <Box className="w-full px-4 pb-6 pt-2">
                        <Text className="font-bold text-lg mb-4 text-typography-900">Map Style</Text>
                        {MAP_STYLES.map((style) => (
                            <ActionsheetItem
                                key={style.url}
                                onPress={() => {
                                    setMapStyle(style.url);
                                    setShowActionsheet(false);
                                }}
                                className={`rounded-xl ${mapStyle === style.url ? 'bg-primary-50' : ''}`}
                            >
                                <ActionsheetItemText className={`${mapStyle === style.url ? 'text-primary-700 font-bold' : 'text-typography-700'}`}>
                                    {style.name}
                                </ActionsheetItemText>
                                {mapStyle === style.url && (
                                    <Icon as={Check} size="sm" className="text-primary-600 ml-auto" />
                                )}
                            </ActionsheetItem>
                        ))}
                    </Box>
                </ActionsheetContent>
            </Actionsheet>
        </>
    )
}

export default MapFabs