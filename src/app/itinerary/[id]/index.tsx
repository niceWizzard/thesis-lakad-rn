import BottomSheet from '@/src/components/ModalBottomSheet'
import { useItineraryStore } from '@/src/stores/useItineraryStore'
import { Ionicons } from '@expo/vector-icons'
import { Camera, MapView, MarkerView } from '@rnmapbox/maps'
import { useLocalSearchParams } from 'expo-router'
import React, { useRef, useState } from 'react'
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

const ItineraryView = () => {
  const { id } = useLocalSearchParams()
  const { itineraries, setItineraryPoiOrder } = useItineraryStore()
  const [isSheetVisible, setSheetVisible] = useState(true)
  const camera = useRef<Camera>(null)

  const itinerary = itineraries.find(v => v.id == id)

  if (!itinerary) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Invalid itinerary id</Text>
      </View>
    )
  }

  // Handle reordering of POIs
  const handleReorder = ({ data }: { data: typeof itinerary.poiOrder }) => {
    if (itinerary) {
      setItineraryPoiOrder(data,itinerary.id)
    }
  }


  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* Map View */}
        <MapView 
          style={styles.map}
          compassEnabled
        >
          <Camera
          ref={camera}
            centerCoordinate={[itinerary.poiOrder[0].longitude, itinerary.poiOrder[0].latitude]}
            defaultSettings={{
              centerCoordinate: [itinerary.poiOrder[0].longitude, itinerary.poiOrder[0].latitude],
              zoomLevel: 15,
              animationDuration: 250,
            }}
            zoomLevel={17}
            minZoomLevel={10}
          />
          {itinerary.poiOrder.map((poi, index) => (
            <MarkerView
              key={`poi-${poi.latitude}-${poi.longitude}`}
              coordinate={[poi.longitude, poi.latitude]}
            >
              <View style={styles.markerContainer}>
                <Pressable>
                  <View style={styles.marker}>
                    <Ionicons name="location" size={20} color="white" />
                    <Text style={styles.markerNumber}>{index + 1}</Text>
                  </View>
                </Pressable>
                <Text style={styles.markerText}>{poi.name}</Text>
              </View>
            </MarkerView>
          ))}
        </MapView>

        {/* Bottom Sheet */}
        <BottomSheet
          isVisible={isSheetVisible}
          onClose={() => setSheetVisible(false)}
          height="50%"
          enableSwipeToClose={false}
          isHideable={false}
          showBackdrop={false}
        >
          <View style={styles.sheetContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.itineraryName}>{itinerary.name}</Text>
              <Text style={styles.poiCount}>
                {itinerary.poiOrder.length} stops
              </Text>
            </View>

            {/* POI List */}
            <View style={styles.poiListContainer}>
              <Text style={styles.sectionTitle}>Your Itinerary</Text>
              
              <FlatList
                data={ itinerary.poiOrder}
                keyboardDismissMode='interactive'
                keyExtractor={(item) => `POI-${item.latitude}-${item.longitude}`}
                              renderItem={ ({item}) =>
                                (
                    <Pressable
                      style={(isActive) => [
                        styles.poiItem,
                        isActive && styles.poiItemActive
                      ]}
                    >
                      <View style={styles.poiItemContent}>
                        <View style={styles.poiItemLeft}>
                          <View style={styles.dragHandle}>
                            <Ionicons name="reorder-three" size={24} color="#666" />
                          </View>
                          <View style={styles.poiInfo}>
                            <Text style={styles.poiName}>{item.name}</Text>
                          </View>
                        </View>
                        <View style={styles.poiActions}>
                          <TouchableOpacity style={styles.actionButton}
                            onPress={() => {
                              camera?.current?.setCamera({
                                zoomLevel: 20,
                                centerCoordinate: [item.longitude, item.latitude],
                              })
                            }}
                          >
                            <Ionicons name="navigate" size={20} color="#007AFF" />
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.actionButton}
                          >
                            {
                              <Ionicons name={item.visited ? 'checkmark' : 'checkbox-outline'} size={20} color="#666" />
                            }
                          </TouchableOpacity>
                        </View>
                      </View>
                    </Pressable>
                  )
                }
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
              />
            </View>

            <View
              style={{gap: 8, flexDirection: 'row'}}
            >
                {/* Optimize Button */}
              <TouchableOpacity style={styles.optimizeButton}>
                <Ionicons name="swap-vertical" size={20} color="white" />
                <Text style={styles.optimizeButtonText}>Optimize Route</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.optimizeButton}>
                <Ionicons name="navigate" size={20} color="white" />
                <Text style={styles.optimizeButtonText}>Navigate Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BottomSheet>
      </View>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '70%',
  },
  markerContainer: {
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  markerNumber: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    position: 'absolute',
  },
  markerText: {
    color: 'black',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
    maxWidth: 100,
  },
  sheetContent: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  itineraryName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  poiCount: {
    fontSize: 16,
    color: '#666',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  poiListContainer: {
    flex: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 16,
  },
  poiItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  poiItemActive: {
    backgroundColor: '#f0f0f0',
    shadowOpacity: 0.3,
    elevation: 6,
  },
  poiItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  poiItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dragHandle: {
    marginRight: 12,
  },
  poiInfo: {
    flex: 1,
  },
  poiName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  poiType: {
    fontSize: 14,
    color: '#666',
  },
  poiActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  optimizeButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  optimizeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
})

export default ItineraryView