import { AlertDialog, AlertDialogBackdrop, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader } from "@/components/ui/alert-dialog";
import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import Mapbox, { PointAnnotation } from "@rnmapbox/maps";
import { Heading } from "lucide-react-native";
import { useRef, useState } from "react";
import { View } from "react-native";
import CustomMapView from "./CustomMapView";

export function LocationDialogSelection({
    show, onClose,
    onConfirmLocation,
}: {
    show: boolean, onClose: () => void,
    onConfirmLocation: (location: GeoJSON.Position) => void
}) {
    const cameraRef = useRef<Mapbox.Camera>(null);
    const [selectedLocation, setSelectedLocation] = useState<GeoJSON.Position | null>(null)

    const handleConfirm = async () => {
        if (selectedLocation) {
            onConfirmLocation(selectedLocation)
            onClose();
        }
    }

    return (
        <AlertDialog isOpen={show}
            onClose={onClose}>
            <AlertDialogBackdrop />
            <AlertDialogContent>
                <AlertDialogHeader>
                    <VStack space="xs">
                        <Heading size="lg">Add to Trip</Heading>
                        <Text size="sm" className="text-typography-500">Select a location on the map to continue.</Text>
                    </VStack>
                </AlertDialogHeader>
                <AlertDialogBody>
                    <VStack className='py-6 px-2'>
                        <CustomMapView
                            cameraRef={cameraRef}
                            mapViewProps={{
                                style: { flex: 1, height: 400, },
                                onPress(feature) {
                                    const coordinates = (feature.geometry as GeoJSON.Point).coordinates;
                                    setSelectedLocation(coordinates);
                                },
                            }}
                        >
                            {
                                selectedLocation && (
                                    <PointAnnotation
                                        id='selected-location'
                                        coordinate={selectedLocation}
                                        draggable
                                        onDragEnd={(feature) => {
                                            setSelectedLocation(feature.geometry.coordinates);
                                        }}
                                    >
                                        <View />
                                    </PointAnnotation>
                                )
                            }
                        </CustomMapView>
                    </VStack>
                </AlertDialogBody>
                <AlertDialogFooter className='border-t border-outline-50 p-6 gap-3'>
                    <HStack space='md'>
                        <Button variant="outline" onPress={onClose}>
                            <ButtonText>Cancel</ButtonText>
                        </Button>
                        <Button action="primary" onPress={handleConfirm}>
                            <ButtonText>Confirm</ButtonText>
                        </Button>
                    </HStack>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}