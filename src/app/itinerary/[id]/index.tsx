import { Actionsheet, ActionsheetContent, ActionsheetDragIndicator, ActionsheetDragIndicatorWrapper } from '@/components/ui/actionsheet'
import { Box } from '@/components/ui/box'
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button'
import { HStack } from '@/components/ui/hstack'
import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { Itinerary } from '@/src/constants/Itineraries'
import { ItineraryStore, useItineraryStore } from '@/src/stores/useItineraryStore'
import { fetchDirections, MapboxRoute } from '@/src/utils/fetchDirections'
import { Camera, Images, LineLayer, Location, MapView, ShapeSource, SymbolLayer, UserLocation } from '@rnmapbox/maps'
import { useLocalSearchParams } from 'expo-router'
import { ArrowDownUp, ArrowUp, Check, CheckCircle, Locate, Menu, Navigation, PlusCircle } from 'lucide-react-native'
import React, { useEffect, useRef, useState } from 'react'
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  ToastAndroid,
  View
} from 'react-native'

const poiIcon = require('@/assets/images/red_marker.png')

enum Mode {
  Viewing,
  Navigating,
}



const ItineraryView = () => {
  const { id } = useLocalSearchParams()
  const { itineraries, setItineraryPoiOrder } = useItineraryStore()
  const camera = useRef<Camera>(null)
  const itinerary = itineraries.find(v => v.id == id)
  const [mode, setMode] = useState<Mode>(Mode.Viewing)
  const [isSheetVisible, setIsSheetVisible] = useState(true)
  const [userLocation, setUserLocation] = useState<Location>();
  const [navigationRoute, setNavigationRoute] = useState<MapboxRoute[]>([])

  const [toGoIndex, setToGoIndex] = useState(0)


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

  const handleNavigationButtonClick = async () => {
    setNavigationRoute([])
    const data = await fetchDirections({
      waypoints: [
        [
          userLocation?.coords.longitude ?? 120.8092,
          userLocation?.coords.latitude ?? 14.8605,
        ],
        [itinerary.poiOrder[toGoIndex].longitude, itinerary.poiOrder[toGoIndex].latitude]
      ],
    })
    setNavigationRoute(data.routes)

    camera.current?.setCamera({
      zoomLevel: 20,
      centerCoordinate: userLocation !== undefined ? [userLocation.coords.longitude, userLocation.coords.latitude + 0.0002] : [120.8092, 14.8605],
      animationDuration: 500,
      pitch: 50,
      heading: data.routes[0].legs[0].steps[0].maneuver.bearing_after,
    })

    setMode(Mode.Navigating)
  }


  return (
    <VStack className='flex-1'>
      {/* Map View */}
      <MapView
        style={{ width: "100%", height: '100%' }}
        compassEnabled
      >
        <UserLocation
          onUpdate={(location) => {
            setUserLocation(location);
          }}
        />
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
        {
          navigationRoute.toReversed().map((route, index) => (
            <ShapeSource
              key={`route-${index}`}
              id={`navigation-${index}`}
              shape={{
                type: 'FeatureCollection',
                features: [
                  {
                    type: 'Feature',
                    id: `route-1`,
                    geometry: route.geometry,
                    properties: {},
                  }
                ]
              }}>
              <LineLayer id={`line-${index}`} style={{
                lineColor: (index === navigationRoute.length - 1) ? '#007AFF' : '#abdded',
                lineWidth: [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  10, 2,   // zoom level 10 → 2 px
                  15, 6,   // zoom level 15 → 6 px
                  20, 15   // zoom level 20 → 10 px
                ],
                lineCap: 'round',
                lineJoin: 'round',
              }}
              />
            </ShapeSource>
          ))
        }
        {
          mode === Mode.Navigating && (
            <ShapeSource
              id="poi-source"
              shape={{
                type: 'FeatureCollection',
                features: [itinerary.poiOrder[toGoIndex]].map((poi, index) => ({
                  type: 'Feature',
                  id: `poi-${index}`,
                  geometry: {
                    type: 'Point',
                    coordinates: [poi.longitude, poi.latitude],
                  },
                  properties: {
                    name: poi.name,
                    visited: poi.visited ? 1 : 0,
                  },
                })),
              }}
            >
              <SymbolLayer
                id="poi-symbols"
                aboveLayerID='line-1'
                style={{
                  iconImage: 'icon',
                  iconAllowOverlap: true,
                  iconSize: .4,
                  textField: ['get', 'name'],
                  textSize: 12,
                  textAnchor: 'top',
                  textOffset: [0, 1.2],

                }}
              />
              <Images images={{ icon: poiIcon }} />
            </ShapeSource>
          )
        }
        {
          mode === Mode.Viewing && (
            <ViewingModeMapViews
              itinerary={itinerary}
              setCamera={(config) => {
                camera.current?.setCamera(config)
              }}
              setSheetVisible={setIsSheetVisible}
              isSheetVisible={isSheetVisible}
              setNavigationRoute={setNavigationRoute}
            />
          )
        }
      </MapView>
      {/* Bottom Sheet */}
      {
        isSheetVisible && (
          <Actionsheet
            key={isSheetVisible ? 'sheet-open' : 'sheet-closed'}
            isOpen={isSheetVisible}
            onClose={() => setIsSheetVisible(false)}
            snapPoints={[45]}
          >
            <ActionsheetContent  >
              <ActionsheetDragIndicatorWrapper>
                <ActionsheetDragIndicator />
              </ActionsheetDragIndicatorWrapper>
              {
                mode === Mode.Viewing && (<>

                  <ViewingModeActionSheet
                    onNavigateButtonClick={handleNavigationButtonClick}
                    itinerary={itinerary}
                    setSheetVisible={setIsSheetVisible}
                    setCamera={(config) => {
                      camera.current?.setCamera(config)
                    }}
                    setItineraryPoiOrder={setItineraryPoiOrder}
                  />
                </>
                )
              }
              {
                mode === Mode.Navigating && (
                  <NavigatingModeActionSheet
                    setCamera={(config) => {
                      camera.current?.setCamera(config)
                    }}
                    routes={navigationRoute}
                    setSheetVisible={setIsSheetVisible}
                    mode={mode}
                    userLocation={userLocation}
                    onExitNavigationMode={() => {
                      camera.current!.setCamera({
                        zoomLevel: 15,
                        centerCoordinate: [itinerary.poiOrder[0].longitude, itinerary.poiOrder[0].latitude - 0.001],
                        animationDuration: 500,
                        pitch: 0,
                      })
                      setMode(Mode.Viewing)
                    }}
                  />
                )
              }
            </ActionsheetContent>
          </Actionsheet>
        )
      }


      <VStack
        space='sm'
        className='w-full justify-center items-center absolute bottom-0 pb-safe px-2  '
        style={{
          marginBottom: isSheetVisible ? '48%' : 0,
        }}
      >
        <HStack className=' w-full justify-between '>
          {
            !isSheetVisible && (

              <>

                <Button
                  className='w-16 h-16 rounded-full'
                  onPress={() => setIsSheetVisible(true)}>
                  <ButtonIcon as={ArrowUp} size='2xl' />
                </Button>
              </>

            )
          }
          <View className='flex-1'>
            <Button
              className='w-16 h-16 rounded-full self-end'
              onPress={() => {
                camera.current?.setCamera({
                  zoomLevel: 18,
                  centerCoordinate: [
                    userLocation?.coords?.longitude ?? 120.8092,
                    userLocation?.coords?.latitude ?? 14.8605 - 0.005
                  ],
                  animationDuration: 250,
                })
              }} >
              <ButtonIcon as={Locate} size='2xl' />
            </Button>
          </View>
        </HStack>
        {
          mode === Mode.Viewing && (
            <HStack space='md'>
              {/* Optimize Button */}
              <Button action='secondary'>
                <ButtonIcon as={ArrowDownUp} />
                <ButtonText>Optimize Route</ButtonText>
              </Button>

              <Button onPress={handleNavigationButtonClick} >
                <ButtonIcon as={Navigation} />
                <ButtonText >Navigate Now</ButtonText>
              </Button>
            </HStack>)
        }
      </VStack>
    </VStack>
  )
}


const ViewingModeMapViews = ({ itinerary, setSheetVisible, isSheetVisible, setNavigationRoute,
  setCamera }: {
    itinerary: Itinerary,
    setCamera: Camera['setCamera'],
    isSheetVisible: boolean,
    setSheetVisible: (v: boolean) => void,
    setNavigationRoute: (navigations: MapboxRoute[]) => void,
  }) => {




  useEffect(() => {
    const coordinates: [number, number][] = itinerary.poiOrder
      .slice(0, Math.min(25, itinerary.poiOrder.length))
      .map(v => [v.longitude, v.latitude]);

    (async () => {
      const data = await fetchDirections({
        waypoints: coordinates
      })
      setNavigationRoute(data.routes)
    })()
  }, [itinerary])
  return (
    <>

      <ShapeSource
        id="poi-source"
        shape={{
          type: 'FeatureCollection',
          features: itinerary.poiOrder.map((poi, index) => ({
            type: 'Feature',
            id: `poi-${index}`,
            geometry: {
              type: 'Point',
              coordinates: [poi.longitude, poi.latitude],
            },
            properties: {
              name: poi.name,
              visited: poi.visited ? 1 : 0,
            },
          })),
        }}

        onPress={(e) => {
          const feature = e.features[0] as any;
          const coords = feature.geometry.coordinates;
          setCamera({
            zoomLevel: 20,
            centerCoordinate: [coords[0], coords[1] - 0.0001],
            animationDuration: 500,
          });

          if (!isSheetVisible)
            setSheetVisible(true);
        }}
      >
        <SymbolLayer
          id="poi-symbols"
          aboveLayerID='line-1'
          style={{
            iconImage: 'icon',
            iconAllowOverlap: true,
            iconSize: .4,
            textField: ['get', 'name'],
            textSize: 12,
            textAnchor: 'top',
            textOffset: [0, 1.2],

          }}
        />
        <Images images={{ icon: poiIcon }} />
      </ShapeSource>
    </>
  )
}

const ViewingModeActionSheet = ({ itinerary,
  setCamera, setItineraryPoiOrder }: {
    setCamera: Camera['setCamera'],
    itinerary: Itinerary,
    setSheetVisible: (v: boolean) => void,
    setItineraryPoiOrder: ItineraryStore['setItineraryPoiOrder'],
    onNavigateButtonClick: () => void,
  }) => {
  return (
    <>
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
                      setCamera({
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
    </>
  )
}

const NavigatingModeActionSheet = ({ userLocation, routes, setCamera, setSheetVisible, onExitNavigationMode }: {
  setSheetVisible: (v: boolean) => void,
  mode: Mode,
  onExitNavigationMode: () => void,
  setCamera: Camera['setCamera'],
  userLocation: Location | undefined,
  routes: MapboxRoute[],
}) => {

  return (
    <>
      <VStack className=' w-full' space='sm'>
        <HStack>
          <Text>Distance: {routes[0].distance}m</Text>
        </HStack>
        <Text>Steps</Text>
        <ScrollView className='max-h-64'>
          {
            routes[0].legs[0].steps.map(v => v.maneuver).map((v, index) => (
              <Box className='bg-background-200 my-2 px-2 py-3 rounded-md' key={`step-${v.location}-${v.instruction}`}>
                <Text >
                  {index + 1}. {v.instruction}
                </Text>
              </Box>
            ))
          }
        </ScrollView>
        <Button onPress={onExitNavigationMode}><ButtonText>Back</ButtonText></Button>
      </VStack>
    </>
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