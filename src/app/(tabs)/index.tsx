import { StyleSheet } from 'react-native';

import ExploreSearchBox from '@/src/components/ExploreSearchBox';
import { View } from '@/src/components/Themed';
import { Camera, MapView } from '@rnmapbox/maps';
import { useRef } from 'react';



const ExploreTab = () => {

    const camera = useRef<Camera>(null);


    return (
        <View style={styles.page}>
          <MapView style={styles.map}
            compassEnabled
            compassPosition={{bottom: 8, right: 8}}
            compassFadeWhenNorth
            scaleBarPosition={{bottom: 24, left: 8}}
          >
            <Camera
              ref={camera}
              zoomLevel={15}
              maxZoomLevel={20}
              minZoomLevel={4}
              centerCoordinate={[120.8092, 14.8605]}
            />
          </MapView>
          <ExploreSearchBox />
        </View>
    )
}



const styles = StyleSheet.create({
    page: {
        flex: 1,
        height: "100%",
        width: "100%",
    },
    map: {
      flex: 1
    },
});

export default ExploreTab