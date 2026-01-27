import { AlertDialog, AlertDialogBackdrop, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader } from "@/components/ui/alert-dialog";
import { Box } from "@/components/ui/box";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button"; // Added ButtonSpinner
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import Mapbox, { PointAnnotation } from "@rnmapbox/maps";
import { useEffect, useRef, useState } from "react";
import { useToastNotification } from "../hooks/useToastNotification";
import { isCoordinateNavigable } from "../utils/isCoordinateNavigable";
import CustomMapView from "./CustomMapView";

export function LocationDialogSelection({
    show, onClose,
    onConfirmLocation,
    initialLocation,
}: {
    show: boolean, onClose: () => void,
    onConfirmLocation: (location: GeoJSON.Position) => void,
    initialLocation?: GeoJSON.Position,
}) {
    const cameraRef = useRef<Mapbox.Camera>(null);
    const [selectedLocation, setSelectedLocation] = useState<GeoJSON.Position | null>((initialLocation as GeoJSON.Position) ?? null);
    const [isVerifying, setIsVerifying] = useState(false); // New loading state

    const [latInput, setLatInput] = useState<string>("");
    const [lngInput, setLngInput] = useState<string>("");

    const { showToast } = useToastNotification();

    useEffect(() => {
        if (selectedLocation) {
            setLngInput(selectedLocation[0].toString());
            setLatInput(selectedLocation[1].toString());
        }
    }, [selectedLocation]);

    const handleManualInputChange = (type: 'lat' | 'lng', value: string) => {
        if (isVerifying) return; // Prevent input during verification

        const cleanValue = value.replace(/[^0-9.-]/g, '');
        if (type === 'lat') setLatInput(cleanValue);
        else setLngInput(cleanValue);

        const lat = type === 'lat' ? parseFloat(cleanValue) : parseFloat(latInput);
        const lng = type === 'lng' ? parseFloat(cleanValue) : parseFloat(lngInput);

        if (!isNaN(lat) && !isNaN(lng)) {
            const newCoords: GeoJSON.Position = [lng, lat];
            setSelectedLocation(newCoords);
            cameraRef.current?.setCamera({
                centerCoordinate: newCoords,
                animationDuration: 500,
            });
        }
    };

    const handleConfirm = async () => {
        if (selectedLocation) {
            setIsVerifying(true); // Start loading
            try {
                const safe = await isCoordinateNavigable(selectedLocation);
                if (safe) {
                    onConfirmLocation(selectedLocation);
                    onClose();
                } else {
                    showToast({
                        title: "Invalid location",
                        description: "The location you have selected is not navigable",
                        action: "error",
                    });
                }
            } catch (error) {
                console.log(error)
                showToast({
                    title: "Verification Error",
                    description: "Unable to verify location at this time",
                    action: "error",
                });
            } finally {
                setIsVerifying(false); // Stop loading
            }
        }
    };

    return (
        <AlertDialog isOpen={show} onClose={() => {
            if (isVerifying) return;
            onClose()
        }}>
            <AlertDialogBackdrop />
            <AlertDialogContent className="rounded-3xl">
                <AlertDialogHeader>
                    <VStack space="xs">
                        <Heading size="lg"><Text>Select Location</Text></Heading>
                        <Text size="sm" className="text-typography-500">
                            <Text>Position the pin or enter coordinates manually.</Text>
                        </Text>
                    </VStack>
                </AlertDialogHeader>

                <AlertDialogBody>
                    <VStack space="md" className="py-4">
                        <Box className={`h-64 w-full rounded-2xl overflow-hidden border border-outline-100 ${isVerifying ? 'opacity-50' : ''}`}>
                            <CustomMapView
                                cameraRef={cameraRef}
                                cameraProps={{
                                    defaultSettings: {
                                        centerCoordinate: initialLocation ?? [120.8092, 14.8605],
                                        zoomLevel: 14,
                                    }
                                }}
                                mapViewProps={{
                                    style: { flex: 1 },
                                    onPress(feature) {
                                        if (isVerifying) return;
                                        const coordinates = (feature.geometry as GeoJSON.Point).coordinates;
                                        setSelectedLocation(coordinates);
                                    },
                                }}
                            >
                                {selectedLocation && (
                                    <PointAnnotation
                                        id='selected-location'
                                        coordinate={selectedLocation}
                                        draggable={!isVerifying}
                                        onDragEnd={(feature) => {
                                            setSelectedLocation(feature.geometry.coordinates);
                                        }}
                                    >
                                        <Box className="h-6 w-6 bg-primary-500 rounded-full border-2 border-white shadow-lg" />
                                    </PointAnnotation>
                                )}
                            </CustomMapView>
                        </Box>

                        <HStack space="md" className="w-full">
                            <VStack className="flex-1" space="xs">
                                <Text size="xs" className="font-bold uppercase text-typography-500"><Text>Latitude</Text></Text>
                                <Input variant="outline" size="md" className="rounded-xl" isDisabled={isVerifying}>
                                    <InputField
                                        placeholder="14.8605"
                                        value={latInput}
                                        onChangeText={(v) => handleManualInputChange('lat', v)}
                                        keyboardType="numeric"
                                    />
                                </Input>
                            </VStack>
                            <VStack className="flex-1" space="xs">
                                <Text size="xs" className="font-bold uppercase text-typography-500"><Text>Longitude</Text></Text>
                                <Input variant="outline" size="md" className="rounded-xl" isDisabled={isVerifying}>
                                    <InputField
                                        placeholder="120.8092"
                                        value={lngInput}
                                        onChangeText={(v) => handleManualInputChange('lng', v)}
                                        keyboardType="numeric"
                                    />
                                </Input>
                            </VStack>
                        </HStack>
                    </VStack>
                </AlertDialogBody>

                <AlertDialogFooter className="border-t border-outline-50 p-6">
                    <HStack space="md" className="w-full">
                        <Button variant="outline" action="secondary" className="flex-1 rounded-xl" onPress={onClose} isDisabled={isVerifying}>
                            <ButtonText><Text>Cancel</Text></ButtonText>
                        </Button>
                        <Button action="primary" className="flex-1 rounded-xl" onPress={handleConfirm} isDisabled={!selectedLocation || isVerifying}>
                            {isVerifying && <ButtonSpinner className="mr-2" />}
                            <ButtonText>
                                <Text>{isVerifying ? "Verifying..." : "Confirm"}</Text>
                            </ButtonText>
                        </Button>
                    </HStack>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}