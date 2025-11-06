import { useItineraryStore } from '@/src/stores/useItineraryStore'
import { Ionicons } from '@expo/vector-icons'
import { Camera, MapView, MarkerView } from '@rnmapbox/maps'
import { useLocalSearchParams } from 'expo-router'
import React from 'react'
import { Pressable, Text, View } from 'react-native'

const ItineraryView = () => {
  const {id} = useLocalSearchParams()
  const {itineraries} = useItineraryStore()

  const itinerary = itineraries.find(v => v.id == id)

  if(!itinerary) {
    return <View style={{flex: 1}}>
      <Text>Invalid itinerary id</Text>
    </View>
  }

  return (
    <View style={{
      flex: 1,
    }}>
      <MapView 
        style={{width: '100%', height: "100%"}}
        compassEnabled
      >
        <Camera
          centerCoordinate={[itinerary.poiOrder[0].longitude, itinerary.poiOrder[0].latitude]}
          defaultSettings={{
            centerCoordinate: [itinerary.poiOrder[0].longitude, itinerary.poiOrder[0].latitude],
            zoomLevel: 15,
          }}
          zoomLevel={17}
          minZoomLevel={10}
        />
        {
          itinerary.poiOrder.map(poi => (
            <MarkerView
              key={`poi-${poi.latitude}-${poi.longitude}`}
              coordinate={[poi.longitude, poi.latitude]}
            >
              <View style={{alignItems: 'center', backgroundColor: 'transparent',}}>
                <Pressable>
                <Ionicons 
                    name='location'
                    size={32}
                />
                
              </Pressable>
              <Text style={{color: 'black'}}>
                  {poi.name}
                </Text>
              </View>
            </MarkerView>
          ))
        }
      </MapView>
    </View>
  )
}

export default ItineraryView