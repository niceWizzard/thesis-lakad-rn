import { Fab, FabIcon } from '@/components/ui/fab';
import { StyleURL } from '@rnmapbox/maps';
import { Layers, LocateFixed } from 'lucide-react-native';
import React from 'react';


const MAP_STYLES = [
    StyleURL.Dark,
    StyleURL.Satellite,
    StyleURL.SatelliteStreet,
    StyleURL.Street,
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

    return (
        <>
            <Fab
                onPress={() => {
                    const currentIndex = MAP_STYLES.indexOf(mapStyle);
                    const nextIndex = (currentIndex + 1) % MAP_STYLES.length;
                    setMapStyle(MAP_STYLES[nextIndex]);
                }}
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
        </>
    )
}

export default MapFabs