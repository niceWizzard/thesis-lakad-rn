import { Fab, FabIcon } from '@/components/ui/fab';
import { StyleURL } from '@rnmapbox/maps';
import { Layers, LocateFixed } from 'lucide-react-native';
import React, { useState } from 'react';


const MAP_STYLES = [
    StyleURL.Dark,
    StyleURL.Satellite,
    StyleURL.SatelliteStreet,
    StyleURL.Street,
]

const MapFabs = ({
    handleLocatePress,
    setMapStyle,
}: {
    handleLocatePress: () => void,
    setMapStyle: React.Dispatch<React.SetStateAction<StyleURL>>
}) => {

    const [mapStyleIndex, setMapStyleIndex] = useState(0)

    return (
        <>
            <Fab
                onPress={() => {
                    setMapStyleIndex(v => {
                        setMapStyle(MAP_STYLES[(v + 1) % MAP_STYLES.length])
                        return v + 1
                    })
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