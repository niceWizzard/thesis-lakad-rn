import { Pressable, StyleSheet } from 'react-native';

import ExploreSearchBox from '@/src/components/ExploreSearchBox';
import { View } from '@/src/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { Camera, Location, LocationPuck, MapView, UserLocation } from '@rnmapbox/maps';
import { useRef, useState } from 'react';

// Define the default coordinates
const DEFAULT_COORDS: [number, number] = [120.8092, 14.8605];
const TARGET_ZOOM = 15;


const ExploreTab = () => {

    const camera = useRef<Camera>(null);
    const map = useRef<MapView>(null);
    const [userLocation, setUserLocation] = useState<Location>()


    // Function to handle the "locate" button press
    const centerMapOnUser = () => {
        // Get the user's coordinates, falling back to the default if not available
        const coordinates: [number, number] = userLocation?.coords.longitude && userLocation?.coords.latitude
            ? [userLocation.coords.longitude, userLocation.coords.latitude]
            : DEFAULT_COORDS;

        // Use the camera ref and the flyTo method to update position and zoom with an animation
        if (camera.current) {
            camera.current?.setCamera({
                centerCoordinate: coordinates,
                zoomLevel: TARGET_ZOOM,
                animationDuration: 500, 
            })
        } else {
            // Fallback for initial load if camera ref is not yet available
            console.log("Camera ref not available yet.");
        }
    };

    return (
        <View style={styles.page}>
          <MapView style={styles.map}
            compassEnabled
            compassPosition={{top: 96, right: 8}}
            scaleBarPosition={{bottom: 24, left: 8}}
            ref={map}
          >
            <UserLocation 
              onUpdate={(location) => {
              setUserLocation(location);
              }}
            />
            <Camera
              ref={camera}
              zoomLevel={TARGET_ZOOM} // Set initial zoom
              maxZoomLevel={20}
              minZoomLevel={4}
              centerCoordinate={DEFAULT_COORDS} // Set initial center
              animationDuration={250}
            />
            <LocationPuck 
              visible
            />
          </MapView>
          <ExploreSearchBox />
          {/* Update the onPress handler to use the new function */}
          <Pressable 
          onPress={centerMapOnUser}
          style={{
             position: 'absolute', bottom: 32, right: 16, backgroundColor: 'white', padding: 12, borderRadius: 8
            }}>
            <Ionicons 
              name='locate'
              size={24}
            />
          </Pressable>
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