import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import {
    Camera,
    LineLayer,
    LocationPuck,
    MapView,
    ShapeSource
} from '@rnmapbox/maps';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Edit } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';

// UI Components
import { Box } from '@/components/ui/box';
import { Button, ButtonIcon } from '@/components/ui/button';
import { VStack } from '@/components/ui/vstack';
import CustomBottomSheet from '@/src/components/CustomBottomSheet';
import LandmarkMarker from '@/src/components/LandmarkMarker';

// Hooks
import { useItineraryData } from '@/src/hooks/itinerary/useItineraryData';
import { useNavigationLogic } from '@/src/hooks/itinerary/useNavigationLogic';
import { Mode, useNavigationState } from '@/src/hooks/itinerary/useNavigationState';
import { useToastNotification } from '@/src/hooks/useToastNotification';
import { useUserLocation } from '@/src/hooks/useUserLocation';

// Refactored Sub-components
import { Portal } from '@/components/ui/portal';
import { MapControls } from '@/src/components/itinerary/MapControls';
import { NavigatingModeBottomSheet } from '@/src/components/itinerary/NavigatingModeBottomSheet';
import { NavigatingModeMapView } from '@/src/components/itinerary/NavigatingModeMapView';
import { ReroutingIndicator } from '@/src/components/itinerary/ReroutingIndicator';
import StopoverCardSwiper from '@/src/components/itinerary/StopoverCardSwiper';
import { ViewingModeBottomSheet } from '@/src/components/itinerary/ViewingModeBottomSheet';
import { ViewingModeMapView } from '@/src/components/itinerary/ViewingModeMapView';
import LoadingModal from '@/src/components/LoadingModal';
import { ItineraryWithStops } from '@/src/model/itinerary.types';
import { useQueryClient } from '@tanstack/react-query';


export default function ItineraryView() {
    const { id, autoOpenCardView } = useLocalSearchParams();
    const router = useRouter();
    const { showToast } = useToastNotification();
    const [isCardViewOpened, setIsCardViewOpened] = useState(false)
    const [localStops, setLocalStops] = useState<ItineraryWithStops['stops']>([])
    const queryClient = useQueryClient()


    // 1. Data Hooks
    const {
        itinerary,
        isLoading,
        refetch,
        pasalubongs,
        nextUnvisitedStop,
        completedStops,
        pendingStops
    } = useItineraryData(id as string);

    // 2. Location
    const userLocation = useUserLocation();

    // 3. Navigation State (Mode, Camera, Sheet)
    const {
        mode,
        isSheetOpen,
        setIsSheetOpen,
        navigationRoute,
        setNavigationRoute,
        cameraRef,
        bottomSheetRef,
        switchMode,
        locatePOI,
        navigationProfile,
        setNavigationProfile,
        avoidTolls,
        setAvoidTolls,
        isVoiceEnabled,
        setIsVoiceEnabled,
    } = useNavigationState(userLocation, !autoOpenCardView);

    // 4. Navigation Logic
    const {
        startNavigation,
        closePasalubongsInPath,
        isCalculatingRoute,
        isStartingNavigation,
        onArrive,
        currentStepIndex,
        currentStepRemainingDistance,
        routeLine
    } = useNavigationLogic({
        mode,
        userLocation,
        navigationRoute,
        setNavigationRoute,
        switchMode,
        nextUnvisitedStop,
        refetchItinerary: refetch,
        pasalubongs,
        cameraRef,
        navigationProfile,
        avoidTolls,
        isVoiceEnabled,
    });

    // Auto-center camera on user location during navigation
    useEffect(() => {
        if (mode === Mode.Navigating && userLocation && cameraRef.current) {
            cameraRef.current.setCamera({
                centerCoordinate: userLocation,
                zoomLevel: 18,
                pitch: 55,
                animationDuration: 300,
            });
        }
    }, [userLocation, mode, cameraRef]);

    const openCardView = useCallback(() => {
        if (!itinerary) return;
        setLocalStops(itinerary.stops)
        setIsSheetOpen(false);
        setIsCardViewOpened(true);
    }, [itinerary, setIsSheetOpen])

    const closeCardView = () => {
        setLocalStops([])
        setIsSheetOpen(true);
        setIsCardViewOpened(false);
    }

    useEffect(() => {
        if (autoOpenCardView && itinerary) {
            openCardView();
            router.setParams({ autoOpenCardView: undefined });
        }
    }, [autoOpenCardView, itinerary, openCardView, router]);


    // Loading State
    if (isLoading || !itinerary) {
        return (
            <Box className='flex-1 justify-center items-center bg-background-0'>
                <ActivityIndicator size="large" color="#007AFF" />
            </Box>
        );
    }

    const handleLocateMe = () => {
        if (userLocation && cameraRef.current) {
            cameraRef.current.setCamera({
                centerCoordinate: userLocation,
                zoomLevel: 18,
                animationDuration: 400
            });
        } else {
            showToast({
                title: "Location not found",
                description: "Waiting for user location...",
                action: "info"
            });
        }
    };





    return (
        <>
            <Stack.Screen
                options={{
                    headerRight: () => (
                        <Button variant="link"
                            onPress={() => router.navigate({
                                pathname: '/itinerary/[id]/info',
                                params: { id: itinerary.id }
                            })}
                            action='secondary'
                        >
                            <ButtonIcon as={Edit} />
                        </Button>
                    )
                }}
            />

            <Portal isOpen={isCardViewOpened}>
                <StopoverCardSwiper
                    onClose={closeCardView}
                    stops={localStops}
                    refetch={async () => {
                        await refetch()
                        await queryClient.invalidateQueries({ queryKey: ['itineraries'] })
                    }}
                    showToast={showToast}
                />
            </Portal>

            <VStack className='flex-1'>
                <MapView
                    style={{ flex: 1 }}
                    logoEnabled={false}
                    attributionEnabled={false}
                    onPress={() => setIsSheetOpen(false)}
                    compassEnabled
                >
                    <Camera
                        ref={cameraRef as any}
                        defaultSettings={{
                            centerCoordinate: itinerary.stops.length > 0 ?
                                [itinerary.stops[0].landmark.longitude, itinerary.stops[0].landmark.latitude] :
                                [120.8092, 14.8605],
                            zoomLevel: 14
                        }}
                    />

                    {/* Route Line */}
                    {navigationRoute.length > 0 && (
                        <ShapeSource id="routeSource" shape={mode === Mode.Navigating && routeLine ? routeLine : navigationRoute[0].geometry}>
                            <LineLayer
                                id="routeLayer"
                                style={{
                                    lineColor: mode === Mode.Navigating ? '#007AFF' : '#94a3b8',
                                    lineWidth: 5,
                                    lineCap: 'round',
                                    lineJoin: 'round'
                                }}
                            />
                        </ShapeSource>
                    )}
                    <LocationPuck pulsing={{ isEnabled: true, color: '#007AFF' }} />

                    <NavigatingModeMapView
                        show={mode === Mode.Navigating}
                        targetLandmark={nextUnvisitedStop?.landmark || null}
                    />

                    <ViewingModeMapView
                        stops={itinerary.stops}
                        show={mode === Mode.Viewing}
                    />

                    {/* Pasalubongs Centers along the route */}
                    {mode === Mode.Navigating && closePasalubongsInPath.map(poi => (
                        <LandmarkMarker
                            key={`nearby-${poi.id}`}
                            landmark={poi}
                            isSelected={false}
                        />
                    ))}
                </MapView>

                <MapControls
                    isSheetOpen={isSheetOpen}
                    onOpenSheet={() => setIsSheetOpen(true)}
                    onLocateMe={handleLocateMe}
                />

                <CustomBottomSheet
                    index={isSheetOpen ? 0 : -1}
                    bottomSheetRef={bottomSheetRef}
                    snapPoints={mode === Mode.Navigating ? ["45%", "70%"] : ["50%", "70%"]}
                    isBottomSheetOpened={isSheetOpen}
                    onClose={() => setIsSheetOpen(false)}
                    enableDynamicSizing={false}
                    enablePanDownToClose={mode !== Mode.Navigating}
                >
                    <BottomSheetScrollView>
                        <ViewingModeBottomSheet
                            itinerary={itinerary}
                            mode={mode}
                            isSheetOpen={isSheetOpen}
                            refetch={refetch}
                            showToast={showToast}
                            locatePOI={locatePOI}
                            canOptimize={pendingStops.length > 1}
                            goNavigationMode={startNavigation}
                            pendingStops={pendingStops}
                            completedStops={completedStops}
                            onCardViewOpen={openCardView}
                        />
                        <NavigatingModeBottomSheet
                            navigationRoute={navigationRoute}
                            mode={mode}
                            nextUnvisitedStop={nextUnvisitedStop}
                            exitNavigationMode={() => switchMode(Mode.Viewing)}
                            navigationProfile={navigationProfile}
                            setNavigationProfile={setNavigationProfile}
                            avoidTolls={avoidTolls}
                            setAvoidTolls={setAvoidTolls}
                            onArrive={onArrive}
                            currentStepIndex={currentStepIndex}
                            currentStepRemainingDistance={currentStepRemainingDistance}
                            isVoiceEnabled={isVoiceEnabled}
                            setVoiceEnabled={setIsVoiceEnabled}
                        />
                    </BottomSheetScrollView>
                </CustomBottomSheet>

                {/* Loading States */}
                <LoadingModal
                    isShown={isStartingNavigation}
                    loadingText="Starting navigation..."
                />
                <ReroutingIndicator visible={isCalculatingRoute && mode === Mode.Navigating} />
            </VStack>
        </>
    );
}