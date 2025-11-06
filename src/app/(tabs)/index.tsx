import { Pressable, StyleSheet, TouchableOpacity } from 'react-native';

import ExploreSearchBox from '@/src/components/ExploreSearchBox';
import SearchResultsBox from '@/src/components/SearchResultsBox';
import { Text, View } from '@/src/components/Themed';
import { historicalLandmarks } from '@/src/constants/Landmarks';
import { Ionicons } from '@expo/vector-icons';
import { Camera, Location, LocationPuck, MapView, MarkerView, UserLocation } from '@rnmapbox/maps';
import { useRef, useState } from 'react';

// Define the default coordinates
const DEFAULT_COORDS: [number, number] = [120.8092, 14.8605];
const TARGET_ZOOM = 15;


const ExploreTab = () => {

    const camera = useRef<Camera>(null);
    const map = useRef<MapView>(null);
    const [userLocation, setUserLocation] = useState<Location>()
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [bottomSheetHeight, setbottomSheetHeight] = useState(0);

    const [searchString, setSearchString] = useState('')


    // Function to handle the "locate" button press
    const centerMapOnCoord = (coordinates: [number, number], zoom?: number) => {
        // Use the camera ref and the flyTo method to update position and zoom with an animation
        if (camera.current) {
            camera.current?.setCamera({
                centerCoordinate: coordinates,
                zoomLevel: zoom ?? TARGET_ZOOM,
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

            {
              historicalLandmarks.map((landmark, index) => (
                <MarkerView
                  key={`landmark-${landmark.id}`}
                  coordinate={[landmark.longitude, landmark.latitude]}
                  isSelected={index == selectedIndex}
                  >
                  <View style={{alignItems: 'center', backgroundColor: 'transparent',}}>
                    <Pressable
                      onPress={() =>
                        {
                          setSelectedIndex(index);
                          centerMapOnCoord([landmark.longitude, landmark.latitude], 18);
                        }
                      }
                    >
                      <Ionicons 
                          name='location-sharp'
                          size={32}
                          color={selectedIndex === index ? 'red' : 'green'}
                        />
                    </Pressable>
                    <Text>{landmark.name}</Text>
                  </View>
                </MarkerView>
              ))
            }
          </MapView>
          {
            selectedIndex !== null && (
              <View 
                style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: '20%', padding: 12, zIndex: 10}} 
                onLayout={(event) => {
                  const { height } = event.nativeEvent.layout;
                  setbottomSheetHeight(height);
                }}
              >
                <Pressable>
                  <Ionicons 
                    name='close-circle'
                    size={32}
                    style={{alignSelf: 'flex-end'}}
                    onPress={() => setSelectedIndex(null)}
                  />
                </Pressable>
                <Text>{historicalLandmarks[selectedIndex].name}</Text>
                <TouchableOpacity style={{marginTop: 12, padding: 12, backgroundColor: 'blue', borderRadius: 8, alignItems: 'center'}}>
                  <Text style={{color: 'white'}}>Add To Itinerary</Text>
                </TouchableOpacity>
              </View>
            )
          }
          <ExploreSearchBox 
            onSearch={setSearchString}
          />
          <SearchResultsBox
            searchString={searchString}
            onResultPress={id => {
              const index = historicalLandmarks.findIndex(v => v.id == id)
              setSelectedIndex(index)
              const landmark = historicalLandmarks[index]
              centerMapOnCoord([landmark.longitude, landmark.latitude], 18);
              setSearchString('')
            }}
          />
          <Pressable 
            onPress={() => {
              const coordinates: [number, number] = userLocation?.coords.longitude && userLocation?.coords.latitude
              ? [userLocation.coords.longitude, userLocation.coords.latitude]
              : DEFAULT_COORDS;
              centerMapOnCoord(coordinates);
            }}
          style={{
             position: 'absolute', bottom: 32 + (selectedIndex != null ? bottomSheetHeight : 0 ), right: 16, backgroundColor: 'white', padding: 12, borderRadius: 8
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