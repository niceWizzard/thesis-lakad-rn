import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import {
    Camera,
    Images,
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
import PlaceMarker from '@/src/components/PlaceMarker';

// Hooks
import { useItineraryData } from '@/src/hooks/itinerary/useItineraryData';
import { useNavigationLogic } from '@/src/hooks/itinerary/useNavigationLogic';
import { Mode, useNavigationState } from '@/src/hooks/itinerary/useNavigationState';
import { useVisualizationLogic } from '@/src/hooks/itinerary/useVisualizationLogic';
import { useToastNotification } from '@/src/hooks/useToastNotification';
import { useUserLocation } from '@/src/hooks/useUserLocation';
import useThemeConfig from '@/src/hooks/useThemeConfig';
import { bbox } from '@turf/turf';

// Refactored Sub-components
import { ItineraryInfoModal } from '@/src/components/itinerary/ItineraryInfoModal';
import { MapControls } from '@/src/components/itinerary/MapControls';
import { NavigatingModeBottomSheet } from '@/src/components/itinerary/NavigatingModeBottomSheet';
import { NavigatingModeMapView } from '@/src/components/itinerary/NavigatingModeMapView';
import { ReroutingIndicator } from '@/src/components/itinerary/ReroutingIndicator';
import StopoverCardSwiper from '@/src/components/itinerary/StopoverCardSwiper';
import { ViewingModeBottomSheet } from '@/src/components/itinerary/ViewingModeBottomSheet';
import { ViewingModeMapView } from '@/src/components/itinerary/ViewingModeMapView';
import { VisualizingFloatingWidget } from '@/src/components/itinerary/VisualizingFloatingWidget';
import LoadingModal from '@/src/components/LoadingModal';
import { QueryKey } from '@/src/constants/QueryKey';
import { ItineraryWithStops } from '@/src/model/itinerary.types';
import { StopWithPlace } from '@/src/model/stops.types';
import { useAuthStore } from '@/src/stores/useAuth';
import { useQueryClient } from '@tanstack/react-query';


const headingArrow = require('@/assets/images/arrow.png');


export default function ItineraryView() {
    const { id, autoOpenCardView } = useLocalSearchParams();
    const router = useRouter();
    const { showToast } = useToastNotification();
    const [isCardViewOpened, setIsCardViewOpened] = useState(false)
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [localStops, setLocalStops] = useState<ItineraryWithStops['stops']>([])
    const queryClient = useQueryClient()
    const { session } = useAuthStore();
    const userId = session?.user?.id;
    const theme = useThemeConfig();


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
    const { userLocation, heading, restartLocationUpdates } = useUserLocation();

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
        restartLocationUpdates
    });
    
    // 5. Visualization Logic
    const {
        startVisualization,
        cancelVisualization,
        currentVisualizationLegIndex,
        totalLegs,
        nextLeg,
        previousLeg,
        visualizationProfile,
        changeProfile,
        currentLegGeometry,
        currentLegDuration,
        currentLegDistance,
        currentLegStartName,
        currentLegEndName,
        isLoading: isVisualizationLoading,
        isVisualizing
    } = useVisualizationLogic(mode, switchMode, userLocation, pendingStops);

    // Auto-center camera on user location during navigation
    useEffect(() => {
        if (mode === Mode.Navigating && userLocation && cameraRef.current) {
            cameraRef.current.setCamera({
                centerCoordinate: userLocation,
                animationDuration: 300,
            });
        }
    }, [userLocation, mode, cameraRef]);
    
    // Auto-bounds for visualization mode
    useEffect(() => {
        if (mode === Mode.Visualizing && currentLegGeometry && cameraRef.current) {
            try {
                // bbox returns [minX, minY, maxX, maxY] equivalent to [w, s, e, n]
                const [minX, minY, maxX, maxY] = bbox(currentLegGeometry);
                const ne = [maxX, maxY];
                const sw = [minX, minY];
                // Fit bounds with maxZoom and padding (bottom padding is higher to account for the overlay widget)
                cameraRef.current.fitBounds(ne, sw, [80, 50, 280, 50], 1000); 
                // We add a setTimeout hack since fitbounds might not enforce strict maxZoom in some versions 
                // but standard bounds automatically calculate best zoom.
            } catch (error) {
                console.warn("Could not fit camera to visualization bounds", error);
            }
        }
    }, [currentLegGeometry, mode, cameraRef]);

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
                animationDuration: 400,
                heading: heading ?? undefined,
            });
        } else {
            showToast({
                title: "Location not found",
                description: "Waiting for user location...",
                action: "info"
            });
        }
    };

    const onStopPress = (stop: StopWithPlace) => {
        setLocalStops([stop])
        setIsSheetOpen(false)
        setIsCardViewOpened(true)
    }
    return (
        <>
            <Stack.Screen
                options={{
                    headerRight: () => (
                        <Button variant="link"
                            onPress={() => setIsInfoModalOpen(true)}
                            action='secondary'
                        >
                            <ButtonIcon as={Edit} />
                        </Button>
                    )
                }}
            />

            {isCardViewOpened && (
                <Box className='absolute top-0 left-0 w-full h-full z-50'>
                    <StopoverCardSwiper
                        onClose={closeCardView}
                        stops={localStops}
                        refetch={async () => {
                            await refetch()
                            await queryClient.invalidateQueries({ queryKey: [QueryKey.ITINERARIES, userId!] })
                        }}
                        showToast={showToast}
                    />
                </Box>
            )}

            <ItineraryInfoModal
                isOpen={isInfoModalOpen}
                onClose={() => setIsInfoModalOpen(false)}
                itineraryId={itinerary.id}
            />

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
                            centerCoordinate: itinerary.stops.length > 0 && itinerary.stops[0]?.place ?
                                [itinerary.stops[0].place.longitude, itinerary.stops[0].place.latitude] :
                                [120.8092, 14.8605],
                            zoomLevel: 14
                        }}
                    />

                    {/* Route Line */}
                    {navigationRoute.length > 0 && mode === Mode.Navigating && (
                        <ShapeSource id="routeSource" shape={routeLine ? routeLine : navigationRoute[0].geometry}>
                            <LineLayer
                                id="routeLayer"
                                style={{
                                    lineColor: '#007AFF',
                                    lineWidth: 5,
                                    lineCap: 'round',
                                    lineJoin: 'round'
                                }}
                            />
                        </ShapeSource>
                    )}
                    
                    {/* Visualization Line */}
                    {mode === Mode.Visualizing && currentLegGeometry && (
                        <ShapeSource id="visualizationSource" shape={currentLegGeometry as any}>
                            <LineLayer
                                id="visualizationLayer"
                                style={{
                                    lineColor: theme.primary[500],
                                    lineWidth: 5,
                                    lineCap: 'round',
                                    lineJoin: 'round'
                                }}
                            />
                        </ShapeSource>
                    )}
                    <Images
                        images={{ headingArrow }}

                    />
                    <LocationPuck
                        puckBearing={'heading'}
                        bearingImage={'headingArrow'}
                        puckBearingEnabled
                        pulsing={{
                            isEnabled: true,
                            color: '#007AFF'
                        }}
                    />

                    <NavigatingModeMapView
                        show={mode === Mode.Navigating}
                        targetLandmark={nextUnvisitedStop?.place || null}
                    />

                    <ViewingModeMapView
                        stops={mode === Mode.Visualizing ? pendingStops : itinerary.stops}
                        show={mode === Mode.Viewing || mode === Mode.Visualizing}
                        onStopPress={mode === Mode.Visualizing ? () => {} : onStopPress}
                    />

                    {/* Pasalubongs Centers along the route */}
                    {mode === Mode.Navigating && closePasalubongsInPath.map(poi => (
                        <PlaceMarker
                            key={`nearby-${poi.id}`}
                            place={poi}
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
                            goNavigationMode={startNavigation}
                            startVisualization={startVisualization}
                            pendingStops={pendingStops}
                            completedStops={completedStops}
                            onCardViewOpen={openCardView}
                            onStopPress={onStopPress}
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
                            pendingStops={pendingStops}
                        />
                    </BottomSheetScrollView>
                </CustomBottomSheet>

                {/* Loading States */}
                <LoadingModal
                    isShown={isStartingNavigation || isVisualizationLoading}
                    loadingText={isVisualizationLoading ? "Calculating route..." : "Starting navigation..."}
                />
                <ReroutingIndicator visible={isCalculatingRoute && mode === Mode.Navigating} />
                
                <VisualizingFloatingWidget
                    isVisible={mode === Mode.Visualizing && isVisualizing}
                    currentLegIndex={currentVisualizationLegIndex}
                    totalLegs={totalLegs}
                    startName={currentLegStartName}
                    endName={currentLegEndName}
                    duration={currentLegDuration}
                    distance={currentLegDistance}
                    profile={visualizationProfile}
                    onNext={nextLeg}
                    onPrevious={previousLeg}
                    onChangeProfile={changeProfile}
                    onCancel={cancelVisualization}
                />
            </VStack>
        </>
    );
}