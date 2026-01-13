import { Fab, FabIcon } from '@/components/ui/fab';
import { Layers, LocateFixed } from 'lucide-react-native';
import React from 'react';


export const MAP_STYLES = {
    standard: "mapbox://styles/mapbox/standard",
    satellite: "mapbox://styles/mapbox/standard-satellite",
};


const MapFabs = ({
    handleLocatePress,
    setMapStyle,
}: {
    handleLocatePress: () => void,
    setMapStyle: React.Dispatch<React.SetStateAction<string>>
}) => {
    return (
        <>
            <Fab
                onPress={() => setMapStyle(prev => prev === MAP_STYLES.standard ? MAP_STYLES.satellite : MAP_STYLES.standard)}
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