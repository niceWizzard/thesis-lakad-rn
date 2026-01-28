import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { Info, MapPin, Star } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image, StyleSheet } from 'react-native';

// UI Components
import { Badge, BadgeText } from '@/components/ui/badge';
import { Box } from '@/components/ui/box';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';

// Custom Components & Stores
import CustomBottomSheet from '@/src/components/CustomBottomSheet';
import LandmarkMapView from '@/src/components/LandmarkMapView';
import { useQueryLandmarks } from '@/src/hooks/useQueryLandmarks';
import { Landmark } from '@/src/model/landmark.types';

const ExploreTab = () => {

    const [selectedLandmark, setSelectedLandmark] = useState<Landmark | null>(null);
    const router = useRouter();
    const camera = useRef<any>(null);

    const sheetRef = useRef<BottomSheet>(null);
    const [sheetIndex, setSheetIndex] = useState(0)

    // Define snap points: 0 is closed, 1 is the 40% mark
    const snapPoints = useMemo(() => ["20%", "80%",], []);

    const { landmarks } = useQueryLandmarks()

    // Sync BottomSheet with selectedLandmark state
    useEffect(() => {
        if (selectedLandmark) {
            // Use requestAnimationFrame to ensure the sheet is ready
            requestAnimationFrame(() => {
                sheetRef.current?.snapToIndex(0);
            });
        } else {
            sheetRef.current?.close();
        }
    }, [selectedLandmark]);

    // 2. Removed local location Effect


    const handleLandmarkLocate = () => {
        if (!selectedLandmark) return;
        camera.current?.setCamera({
            zoomLevel: 20,
            animationDuration: 1000,
            centerCoordinate: [selectedLandmark.longitude, selectedLandmark.latitude - 0.00015],
        });
    };

    const handleBackdropPress = () => {
        setSelectedLandmark(null)
    }



    return (
        <Box className="flex-1 bg-background-0">
            <LandmarkMapView
                mapViewProps={{
                    onPress: () => setSelectedLandmark(null),
                }}
                cameraRef={camera}
                selectedLandmark={selectedLandmark}
                setSelectedLandmark={setSelectedLandmark}
                landmarks={landmarks}
            />

            <CustomBottomSheet
                onChange={(index) => setSheetIndex(index)}
                bottomSheetRef={sheetRef}
                isBottomSheetOpened={!!selectedLandmark}
                snapPoints={snapPoints}
                enablePanDownToClose
                onClose={handleBackdropPress}
            >
                <BottomSheetScrollView
                    contentContainerStyle={styles.scrollContent}
                >
                    {selectedLandmark ? (
                        <VStack className="gap-6">
                            {/* Header Info */}
                            <VStack className="gap-2">
                                <HStack className="justify-between items-start">
                                    <VStack className="flex-1 pr-4">
                                        <Heading size="xl" className="text-typography-900 leading-tight">
                                            {selectedLandmark.name}
                                        </Heading>
                                        <HStack space="xs" className="mt-1 items-center">
                                            <Icon as={MapPin} size="xs" className="text-primary-600" />
                                            <Text size="sm" className="text-typography-500 font-medium">
                                                {selectedLandmark.municipality}, District {selectedLandmark.district}
                                            </Text>
                                        </HStack>
                                    </VStack>

                                    <HStack className="items-center bg-warning-50 px-3 py-1.5 rounded-2xl border border-warning-100">
                                        <Icon as={Star} size="xs" className="text-warning-600 mr-1" fill="#d97706" />
                                        <Text size="sm" className="font-bold text-warning-700">
                                            {selectedLandmark.gmaps_rating?.toFixed(1) ?? '0.0'}
                                        </Text>
                                    </HStack>
                                </HStack>

                                <HStack space="xs" className="flex-wrap mt-1">
                                    <Badge
                                        action="info" variant="solid" className="rounded-lg bg-primary-50 border-none">
                                        <BadgeText className="text-[10px] text-primary-700 uppercase font-bold">{selectedLandmark.type}</BadgeText>
                                    </Badge>
                                </HStack>
                            </VStack>

                            {
                                sheetIndex > 0 && (
                                    <>
                                        {/* Image Section */}
                                        <Image
                                            source={{ uri: selectedLandmark.image_url || "https://via.placeholder.com/600x400" }}
                                            className="w-full h-56 rounded-[32px] bg-background-100"
                                            resizeMode="cover"
                                        />

                                        {/* Description */}
                                        <VStack space="xs">
                                            <Text size="sm" className="font-bold text-typography-900 uppercase tracking-wider">About</Text>
                                            <Box className="bg-background-50 p-4 rounded-2xl border border-outline-50">
                                                <Text size="sm" className="text-typography-600 leading-relaxed">
                                                    {selectedLandmark.description || "This site holds deep historical significance in the province. It served as a pivotal location during the late 19th century and continues to stand as a testament to the local heritage and resilience of the community."}
                                                </Text>
                                            </Box>
                                        </VStack>

                                        {/* Actions */}
                                        <HStack space="md" className="pb-10">
                                            <Button
                                                className="flex-1 rounded-2xl h-14 bg-primary-600 shadow-soft-2"
                                                onPress={() => {
                                                    router.navigate({
                                                        pathname: '/landmark/[id]/view',
                                                        params: {
                                                            id: selectedLandmark.id.toString(),
                                                            previewMode: 'true',
                                                        },
                                                    });
                                                }}
                                            >
                                                <ButtonIcon as={Info} className="mr-2" />
                                                <ButtonText className="font-bold">Full Details</ButtonText>
                                            </Button>

                                            <Button
                                                variant="outline"
                                                className="rounded-2xl h-14 w-16 border-outline-200 bg-background-50"
                                                onPress={handleLandmarkLocate}
                                            >
                                                <ButtonIcon as={MapPin} className="text-primary-600" />
                                            </Button>
                                        </HStack>
                                    </>
                                )
                            }
                        </VStack>
                    ) : (
                        <Box className="flex-1 justify-center items-center p-10">
                            <Text className="text-typography-400 italic text-center">
                                Select a marker on the map to see details
                            </Text>
                        </Box>
                    )}
                </BottomSheetScrollView>
            </CustomBottomSheet>
        </Box >
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
    },
});

export default ExploreTab;