import { Actionsheet, ActionsheetContent, ActionsheetDragIndicator, ActionsheetDragIndicatorWrapper } from '@/components/ui/actionsheet'
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button'
import { Fab, FabIcon } from '@/components/ui/fab'
import { HStack } from '@/components/ui/hstack'
import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { Itinerary } from '@/src/constants/Itineraries'
import { ItineraryStore, useItineraryStore } from '@/src/stores/useItineraryStore'
import { Camera, Images, LineLayer, Location, MapView, ShapeSource, SymbolLayer, UserLocation } from '@rnmapbox/maps'
import { useLocalSearchParams } from 'expo-router'
import { ArrowDownUp, ArrowUp, Box, Check, CheckCircle, Menu, Navigation, PlusCircle } from 'lucide-react-native'
import React, { useEffect, useRef, useState } from 'react'
import {
  FlatList,
  Pressable,
  StyleSheet,
  ToastAndroid
} from 'react-native'

const poiIcon = require('@/assets/images/red_marker.png')

enum Mode {
  Viewing,
  Navigating,
}

const accessToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";


const ItineraryView = () => {
  const { id } = useLocalSearchParams()
  const { itineraries, setItineraryPoiOrder } = useItineraryStore()
  const camera = useRef<Camera>(null)
  const itinerary = itineraries.find(v => v.id == id)
  const [mode, setMode] = useState<Mode>(Mode.Viewing)
  const [isViewingModeSheetVisible, setIsViewingModeSheetVisible] = useState(true)
  const [isNavigatingModeSheetVisible, setIsNavigatingModeSheetVisible] = useState(false);
  const [userLocation, setUserLocation] = useState<Location>();
  const [navigationRoute, setNavigationRoute] = useState<GeoJSON.FeatureCollection | null>(null)
  const [navigationLegs, setNavigationLegs] = useState<{ [key: string]: any } | undefined>()

  const [toGoIndex, setToGoIndex] = useState(0)

  useEffect(() => {
    if (mode === Mode.Navigating) {
      camera.current?.setCamera({
        zoomLevel: 20,
        centerCoordinate: userLocation !== undefined ? [userLocation.coords.longitude, userLocation.coords.latitude - 0.0001] : [120.8092, 14.8605],
        animationDuration: 500,
        pitch: 50,
      })
    }
  }, [mode])

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

  const fetchRoute = async () => {
    const BASE_URl = 'https://api.mapbox.com/directions/v5/mapbox/driving'
    const coordinates = [
      [
        userLocation?.coords.longitude ?? 120.8092,
        userLocation?.coords.latitude ?? 14.8605,
      ],
      [itinerary.poiOrder[toGoIndex].longitude, itinerary.poiOrder[toGoIndex].latitude],
    ].map(v => `${v[0]},${v[1]}`).join(';')
    const url = `${BASE_URl}/${coordinates}?alternatives=true&geometries=geojson&steps=true&access_token=${accessToken}`

    const res = await fetch(url)
    const data = await res.json()
    console.log("WOW", data.routes[0].legs)
    return data
  }

  const handleNavigationButtonClick = async () => {
    setNavigationRoute(null)
    const data = await fetchRoute()
    setNavigationLegs(data.routes[0].legs)
    setNavigationRoute({
      type: 'FeatureCollection',
      features: data.routes.map((route: any, index: number) => ({
        type: 'Feature',
        id: `route-${index}`,
        geometry: route.geometry
      }))
    })
    setIsViewingModeSheetVisible(false)
    setIsNavigatingModeSheetVisible(true)
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
          navigationRoute && (
            <ShapeSource id='navigation-1' shape={navigationRoute}>
              <LineLayer id='line-1' style={{
                lineColor: '#007AFF',
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
          )
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
              setSheetVisible={setIsViewingModeSheetVisible}
              isSheetVisible={isViewingModeSheetVisible}
              setNavigationRoute={setNavigationRoute}
            />
          )
        }
      </MapView>
      {/* Bottom Sheet */}
      {
        mode === Mode.Viewing && (
          <ViewingModeActionSheet
            onNavigateButtonClick={handleNavigationButtonClick}
            itinerary={itinerary}
            isSheetVisible={isViewingModeSheetVisible}
            setSheetVisible={setIsViewingModeSheetVisible}
            setCamera={(config) => {
              camera.current?.setCamera(config)
            }}
            setItineraryPoiOrder={setItineraryPoiOrder}
          />
        )
      }
      {
        mode === Mode.Navigating && (
          <NavigatingModeActionSheet
            setCamera={(config) => {
              camera.current?.setCamera(config)
            }}
            isSheetVisible={isNavigatingModeSheetVisible}
            setSheetVisible={setIsNavigatingModeSheetVisible}
            mode={mode}
            userLocation={userLocation}
            legs={navigationLegs}
            onExitNavigationMode={() => {
              setIsNavigatingModeSheetVisible(false)
              setIsViewingModeSheetVisible(true)
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
    </VStack>
  )
}


const ViewingModeMapViews = ({ itinerary, setSheetVisible, isSheetVisible, setNavigationRoute,
  setCamera }: {
    itinerary: Itinerary,
    setCamera: Camera['setCamera'],
    isSheetVisible: boolean,
    setSheetVisible: (v: boolean) => void,
    setNavigationRoute: (navigation: GeoJSON.FeatureCollection) => void,
  }) => {




  useEffect(() => {
    const BASE_URl = 'https://api.mapbox.com/directions/v5/mapbox/driving'
    const coordinates = itinerary.poiOrder.slice(0, Math.min(25, itinerary.poiOrder.length)).map(v => `${v.longitude},${v.latitude}`).join(';');
    (async () => {
      const url = `${BASE_URl}/${coordinates}?alternatives=true&geometries=geojson&steps=true&access_token=${accessToken}`
      const response = await fetch(url)
      const data = await response.json()
      setNavigationRoute({
        type: 'FeatureCollection',
        features: data.routes.map((route: any, index: number) => ({
          type: 'Feature',
          id: `route-${index}`,
          geometry: route.geometry
        }))
      })
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
  isSheetVisible, setSheetVisible,
  onNavigateButtonClick,
  setCamera, setItineraryPoiOrder }: {
    setCamera: Camera['setCamera'],
    itinerary: Itinerary, isSheetVisible: boolean,
    setSheetVisible: (v: boolean) => void,
    setItineraryPoiOrder: ItineraryStore['setItineraryPoiOrder'],
    onNavigateButtonClick: () => void,
  }) => {
  return (
    <>
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
            <HStack
              space='sm'
              className='w-full justify-center'
            >
              {/* Optimize Button */}
              <Button>
                <ButtonIcon as={ArrowDownUp} />
                <ButtonText>Optimize Route</ButtonText>
              </Button>

              <Button onPress={onNavigateButtonClick} >
                <ButtonIcon as={Navigation} />
                <ButtonText >Navigate Now</ButtonText>
              </Button>
            </HStack>
          </VStack>
        </ActionsheetContent>
      </Actionsheet>
      {
        !isSheetVisible && (
          <Fab size='lg' onPress={() => setSheetVisible(true)} >
            <FabIcon as={ArrowUp} size='xl' />
          </Fab>
        )
      }
    </>
  )
}

const NavigatingModeActionSheet = ({ userLocation, isSheetVisible, setSheetVisible, legs, onExitNavigationMode }: {
  isSheetVisible: boolean,
  setSheetVisible: (v: boolean) => void,
  mode: Mode,
  onExitNavigationMode: () => void,
  setCamera: Camera['setCamera'],
  userLocation: Location | undefined,
  legs: any,
}) => {

  useEffect(() => {
    console.log("LEGGS!", legs[0].steps)
  })

  return (
    <>
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
            <Text>Navigating Mode</Text>
            <Text>
              {
                legs && (
                  legs[0].steps[0].maneuver.instruction
                )
              }
            </Text>
            <Button onPress={onExitNavigationMode}><ButtonText>Back</ButtonText></Button>
          </VStack>
        </ActionsheetContent>
      </Actionsheet>
      {
        !isSheetVisible && (
          <Fab size='lg' onPress={() => setSheetVisible(true)} >
            <FabIcon as={ArrowUp} size='xl' />
          </Fab>
        )
      }

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