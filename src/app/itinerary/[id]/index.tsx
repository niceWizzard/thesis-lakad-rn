import { Actionsheet, ActionsheetContent, ActionsheetDragIndicator, ActionsheetDragIndicatorWrapper } from '@/components/ui/actionsheet'
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button'
import { HStack } from '@/components/ui/hstack'
import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { useItineraryStore } from '@/src/stores/useItineraryStore'
import { Callout, Camera, MapView, PointAnnotation } from '@rnmapbox/maps'
import { useLocalSearchParams } from 'expo-router'
import { ArrowDownUp, Box, Check, CheckCircle, Menu, Navigation, PlusCircle } from 'lucide-react-native'
import React, { useRef, useState } from 'react'
import {
  FlatList,
  Pressable,
  StyleSheet,
  ToastAndroid,
  View
} from 'react-native'

const ItineraryView = () => {
  const { id } = useLocalSearchParams()
  const { itineraries, setItineraryPoiOrder } = useItineraryStore()
  const [isSheetVisible, setSheetVisible] = useState(true)
  const camera = useRef<Camera>(null)

  const itinerary = itineraries.find(v => v.id == id)

  if (!itinerary) {
    return (
      <Box className='justify-center items-center w-full h-full'>
        <Text>Invalid itinerary id</Text>
      </Box>
    )
  }

  // Handle reordering of POIs
  const handleReorder = ({ data }: { data: typeof itinerary.poiOrder }) => {
    if (itinerary) {
      setItineraryPoiOrder(data, itinerary.id)
    }
  }


  return (
    <VStack className='flex-1'>
      {/* Map View */}
      <MapView
        style={{ width: "100%", height: '100%' }}
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
          <PointAnnotation
            id={`POI-${poi.latitude}-${poi.longitude}`}
            key={`POI-${poi.latitude}-${poi.longitude}`}
            coordinate={[poi.longitude, poi.latitude]}
            title={poi.name}

            onSelected={(feature: any) => {
              console.log('onSelected:', feature.id, feature.geometry.coordinates)
              camera.current?.setCamera({
                zoomLevel: 20,
                centerCoordinate: [poi.longitude, poi.latitude - 0.0001],
                animationDuration: 500,
              })
              if (!isSheetVisible)
                setSheetVisible(true)
            }
            }
          >
            <View>
            </View>
            <Callout title={poi.name} />
          </PointAnnotation>
        ))}
      </MapView>
      {/* Bottom Sheet */}
      <Actionsheet
        key={isSheetVisible ? 'sheet-open' : 'sheet-closed'}
        isOpen={isSheetVisible}
        onClose={() => setSheetVisible(false)}
        snapPoints={[45]}
      >
        <ActionsheetContent  >
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>
          <VStack className=' w-full' space='sm'>
            {/* Header */}
            <VStack className='w-full' space='md'>
              <HStack className='w-full justify-between' >
                <Text size='2xl' className='font-semibold'>
                  {itinerary.name}
                </Text>
                <Pressable
                  onPress={() => {
                    ToastAndroid.show('Add POI functionality coming soon!', ToastAndroid.SHORT)
                  }}
                >
                  <Icon
                    as={PlusCircle}
                    size='xl'
                  />
                </Pressable>
              </HStack>
              <Text size='sm'>
                {itinerary.poiOrder.length} stops
              </Text>
            </VStack>
            {/* POI List */}
            <VStack space='sm' className='w-full'>
              <FlatList
                data={itinerary.poiOrder}
                className='max-h-64'
                keyboardDismissMode='interactive'
                keyExtractor={(item) => `ItineraryView-POI-${item.latitude}-${item.longitude}`}
                renderItem={({ item }) =>
                (
                  <Pressable className='p-2'>
                    <HStack space='md' className='w-full items-center'>
                      <HStack space='sm' className='flex-1 items-center' style={{ flexShrink: 1 }}>
                        <Icon as={Menu} />
                        <Text style={[item.visited && { textDecorationLine: 'line-through' }]}>{item.name}</Text>
                      </HStack>
                      <HStack className='justify-end' space='md' >
                        <Button
                          variant='link'
                          onPress={() => {
                            camera?.current?.setCamera({
                              zoomLevel: 20,
                              centerCoordinate: [item.longitude, item.latitude - 0.0001],
                              animationDuration: 500,
                            })
                          }}
                        >
                          <ButtonIcon as={Navigation} />
                        </Button>
                        <Button
                          variant='link'
                          onPress={() => {
                            console.log("CLICKEEE")
                            setItineraryPoiOrder(
                              itinerary.poiOrder.map(v => {
                                if (v.longitude !== item.longitude && v.latitude !== item.latitude) {
                                  return v
                                }
                                return {
                                  ...v,
                                  visited: !v.visited,
                                }
                              }),
                              itinerary.id
                            )
                          }}
                        >
                          {
                            <ButtonIcon
                              as={item.visited ? Check : CheckCircle}
                            />
                          }
                        </Button>
                      </HStack>
                    </HStack>
                  </Pressable>
                )
                }
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
              />
            </VStack>
            <HStack
              space='sm'
              className='w-full justify-center'
            >
              {/* Optimize Button */}
              <Button>
                <ButtonIcon as={ArrowDownUp} />
                <ButtonText>Optimize Route</ButtonText>
              </Button>

              <Button >
                <ButtonIcon as={Navigation} />
                <ButtonText >Navigate Now</ButtonText>
              </Button>
            </HStack>
          </VStack>
        </ActionsheetContent>
      </Actionsheet>
    </VStack>
  )
}

const styles = StyleSheet.create({
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