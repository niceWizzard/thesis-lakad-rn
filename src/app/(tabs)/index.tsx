import { StyleSheet } from 'react-native';

import { View } from '@/src/components/Themed';
import { MapView } from '@rnmapbox/maps';


const styles = StyleSheet.create({
    page: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    container: {
        height: "100%",
        width: "100%",
        backgroundColor: "tomato"
    },
    map: {
        flex: 1
    }
});

const ExploreTab = () => {
    return (
        <View style={styles.page}>
            <View style={styles.container}>
                <MapView style={styles.map} />
            </View>
        </View>
    )
}

export default ExploreTab