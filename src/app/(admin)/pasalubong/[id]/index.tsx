import Mapbox from '@rnmapbox/maps';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
    Edit2,
    Eye,
    History,
    MapPin,
    Navigation2,
    RefreshCcw,
    Star,
    Trash2
} from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Image, ScrollView } from 'react-native';

import {
    AlertDialog,
    AlertDialogBackdrop,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
} from '@/components/ui/alert-dialog';
import { Badge, BadgeText } from '@/components/ui/badge';
import { Box } from '@/components/ui/box';
import { Button, ButtonGroup, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Divider } from '@/components/ui/divider';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';

import { useToastNotification } from '@/src/hooks/useToastNotification';
import { fetchPasalubongCenterById } from '@/src/utils/landmark/fetchPasalubongCenters';
import { supabase } from '@/src/utils/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export default function AdminPasalubongDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { showToast } = useToastNotification();
    const queryClient = useQueryClient();
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);


    // --- DATA FETCHING ---
    const { data: landmark, isLoading, error } = useQuery({
        queryKey: ['pasalubong-center', id],
        queryFn: () => fetchPasalubongCenterById(id as string),
        enabled: !!id,
    });

    const isArchived = landmark?.deleted_at !== null;

    // --- DELETE/RESTORE MUTATION ---
    const toggleArchiveMutation = useMutation({
        mutationFn: async (shouldRestore: boolean = false) => {
            const { error } = await supabase
                .from('places')
                .update({
                    deleted_at: shouldRestore ? null : new Date().toISOString(),
                })
                .eq('id', id as any);
            if (error) throw error;

            await queryClient.invalidateQueries({ queryKey: ['pasalubong-center', id] });
            await queryClient.invalidateQueries({ queryKey: ['pasalubong-centers'] });
            await queryClient.invalidateQueries({ queryKey: ['archived-pasalubong-centers'] });
        },
        onSuccess: (_, isRestoring) => {
            showToast({
                title: isRestoring ? "Pasalubong Center Restored" : "Pasalubong Center Archived",
            })
            if (!isRestoring) router.back();
        },
    });

    if (isLoading) return <Box className="flex-1 justify-center items-center"><ActivityIndicator size="large" /></Box>;
    if (error) {
        return <Box className="flex-1 justify-center">
            <Text className="text-center">Error fetching Pasalubong Center</Text>
            <Button onPress={() => queryClient.invalidateQueries({ queryKey: ['pasalubong-center', id] })}>
                <ButtonText>Retry</ButtonText>
            </Button>
        </Box>;
    }
    if (!landmark) return <Box className="flex-1 justify-center"><Text className="text-center">Pasalubong Center not found</Text></Box>;

    return (
        <>
            <Stack.Screen options={{
                headerTitle: isArchived ? "Archived Pasalubong" : "Pasalubong Details",
            }} />

            <Box className="flex-1 bg-background-0">

                {/* DELETE CONFIRMATION */}
                <AlertDialog isOpen={showDeleteAlert} onClose={() => setShowDeleteAlert(false)}>
                    <AlertDialogBackdrop />
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <Heading size="lg" className="text-error-600">Archive Pasalubong Center?</Heading>
                        </AlertDialogHeader>
                        <AlertDialogBody>
                            <Text size="sm">
                                This will remove &quot;{landmark.name}&quot; from public searches. It will remain in the database.
                            </Text>
                        </AlertDialogBody>
                        <AlertDialogFooter className='mt-3'>
                            <ButtonGroup space="lg" flexDirection='row'>
                                <Button variant="outline" action="secondary" onPress={() => setShowDeleteAlert(false)}>
                                    <ButtonText>Cancel</ButtonText>
                                </Button>
                                <Button
                                    action="negative"
                                    onPress={() => {
                                        setShowDeleteAlert(false);
                                        toggleArchiveMutation.mutate(false);
                                    }}
                                >
                                    <ButtonText>{toggleArchiveMutation.isPending ? "Archiving..." : "Archive"}</ButtonText>
                                </Button>
                            </ButtonGroup>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Status Bar */}
                <Box className={`p-4 border-b border-outline-100 ${isArchived ? '' : 'bg-background-50'}`}>
                    <HStack className="justify-between items-center">
                        <VStack>
                            <Text size="xs" className="uppercase font-bold text-typography-400">Visibility</Text>
                            <Badge action={isArchived ? "warning" : "success"} variant="solid" className="rounded-md self-start mt-1">
                                <BadgeText>{isArchived ? "ARCHIVED" : "LIVE ON APP"}</BadgeText>
                            </Badge>
                        </VStack>

                        <HStack space="sm">
                            {isArchived ? (
                                <Button
                                    variant="outline"
                                    action="primary"
                                    size="xs"
                                    onPress={() => toggleArchiveMutation.mutate(true)}
                                >
                                    <ButtonText>Restore</ButtonText>
                                    <ButtonIcon as={RefreshCcw} className="ml-1" />
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    action="secondary"
                                    size="xs"
                                    onPress={() => router.navigate({
                                        pathname: `/landmark/[id]/view`, // Reuse the view screen for now, or create a specific one if needed
                                        params: { id: landmark.id.toString(), previewMode: 'true', isPasalubong: 'true' }
                                    })}
                                >
                                    <ButtonText>User View</ButtonText>
                                    <ButtonIcon as={Eye} className="ml-1" />
                                </Button>
                            )}
                        </HStack>
                    </HStack>
                </Box>

                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                    <VStack className={`p-6 gap-6 ${isArchived ? 'opacity-70' : ''}`}>

                        {/* 1. HERO IMAGE */}
                        <Box className="relative">
                            <Image
                                source={{ uri: landmark.image_url || 'https://via.placeholder.com/600x400' }}
                                className="w-full h-64 rounded-3xl bg-background-100"
                                resizeMode="cover"
                            />
                        </Box>

                        {/* 2. CORE INFORMATION CARD */}
                        <VStack space="md" className="bg-background-50 p-5 rounded-3xl border border-outline-100">
                            <HStack className="justify-between items-start">
                                <VStack className="gap-1 flex-1">
                                    <Text size="xs" className="font-bold text-typography-400 uppercase">Official Name</Text>
                                    <Text size="xl" className="font-bold text-typography-900">{landmark.name}</Text>
                                </VStack>
                                <VStack className="items-end">
                                    <Text size="xs" className="font-bold text-typography-400 uppercase mb-1">Rating</Text>
                                    <HStack className="items-center bg-warning-50 px-3 py-1 rounded-full border border-warning-100">
                                        <Icon as={Star} size="xs" className="text-warning-600 mr-1" fill="#d97706" />
                                        <Text size="sm" className="font-bold text-warning-700">
                                            {landmark.gmaps_rating ? landmark.gmaps_rating.toFixed(1) : '0.0'}
                                        </Text>
                                    </HStack>
                                </VStack>
                            </HStack>
                        </VStack>

                        {/* 3. COORDINATES CARD */}
                        <VStack space="md" className="bg-background-50 p-5 rounded-3xl border border-outline-100">
                            <HStack className="items-center gap-2">
                                <Icon as={Navigation2} size="sm" className="text-primary-600" />
                                <Heading size="sm">Location Details</Heading>
                            </HStack>
                            <HStack space="md">
                                <VStack className="flex-1 gap-1">
                                    <Text size="xs" className="font-bold text-typography-400 uppercase">District</Text>
                                    <Text size="md" className="font-medium text-typography-800">{landmark.district || 'N/A'}</Text>
                                </VStack>
                                <VStack className="flex-1 gap-1">
                                    <Text size="xs" className="font-bold text-typography-400 uppercase">Municipality</Text>
                                    <Text size="md" className="font-medium text-typography-800">{landmark.municipality || 'N/A'}</Text>
                                </VStack>
                            </HStack>
                            <Divider />
                            <HStack space="md">
                                <VStack className="flex-1 bg-background-100 p-3 rounded-xl border border-outline-50">
                                    <Text size="xs" className="text-typography-400 font-bold uppercase mb-1">Lat</Text>
                                    <Text size="sm" className="font-mono">{landmark.latitude}</Text>
                                </VStack>
                                <VStack className="flex-1 bg-background-100 p-3 rounded-xl border border-outline-50">
                                    <Text size="xs" className="text-typography-400 font-bold uppercase mb-1">Lng</Text>
                                    <Text size="sm" className="font-mono">{landmark.longitude}</Text>
                                </VStack>
                            </HStack>
                        </VStack>

                        {/* 4. MAP PREVIEW */}
                        <VStack space="md" className="bg-background-50 p-2 rounded-3xl border border-outline-100 overflow-hidden">
                            <Box className="h-48 w-full rounded-2xl overflow-hidden bg-background-200">
                                {(Math.abs(landmark.longitude) <= 180 && Math.abs(landmark.latitude) < 90) ? (
                                    <Mapbox.MapView
                                        style={{ flex: 1 }}
                                        zoomEnabled={false}
                                        scrollEnabled={false}
                                        logoEnabled={false}
                                        attributionEnabled={false}
                                    >
                                        <Mapbox.Camera
                                            defaultSettings={{
                                                centerCoordinate: [landmark.longitude, landmark.latitude],
                                                zoomLevel: 14
                                            }}
                                        />
                                        <Mapbox.PointAnnotation
                                            id="landmark-marker"
                                            coordinate={[landmark.longitude, landmark.latitude]}
                                        >
                                            <Box className="bg-primary-600 p-2 rounded-full shadow-md">
                                                <MapPin color="white" size={16} />
                                            </Box>
                                        </Mapbox.PointAnnotation>
                                    </Mapbox.MapView>
                                ) : (
                                    <Box className="flex-1 justify-center items-center"><Text>No Coordinates</Text></Box>
                                )}
                            </Box>
                        </VStack>

                        {/* 5. DESCRIPTION */}
                        <VStack className="gap-3">
                            <Heading size="sm" className="ml-1">Description</Heading>
                            <Box className="bg-background-50 p-5 rounded-3xl border border-outline-100">
                                <Text size="sm" className="leading-relaxed text-typography-700">{landmark.description || 'No description provided.'}</Text>
                            </Box>
                        </VStack>

                        {/* 6. SYSTEM FOOTER */}
                        <Box className="bg-secondary-50 p-5 rounded-3xl border border-secondary-100 mb-10">
                            <HStack space="sm" className="items-center">
                                <Icon as={History} size="sm" className="text-secondary-600" />
                                <VStack>
                                    <Text size="xs" className="text-secondary-700 font-bold uppercase">System ID: {landmark.id}</Text>
                                    <Text size="xs" className="text-secondary-600">
                                        Record Created: {new Date(landmark.created_at).toLocaleString()}
                                    </Text>
                                    {isArchived && (
                                        <Text size="xs" className="text-error-600 font-bold">
                                            Archived On: {new Date(landmark.deleted_at!).toLocaleString()}
                                        </Text>
                                    )}
                                </VStack>
                            </HStack>
                        </Box>
                    </VStack>
                </ScrollView>

                {/* FIXED ACTION BAR */}
                <Box className="p-6  border-t border-outline-50 shadow-lg bg-background-50">
                    <HStack space="md">
                        <Button
                            className={`flex-1 rounded-2xl h-14 ${isArchived ? 'bg-background-100' : 'bg-primary-600'}`}
                            onPress={() => !isArchived && router.navigate({
                                pathname: `/(admin)/pasalubong/[id]/edit`,
                                params: {
                                    id: landmark.id.toString(),
                                }
                            })}
                            disabled={isArchived}
                        >
                            <ButtonIcon as={Edit2} className={isArchived ? "text-typography-300" : "mr-2"} />
                            <ButtonText className={isArchived ? "text-typography-400" : "font-bold"}>
                                {isArchived ? "Archived (No Edit)" : "Edit Content"}
                            </ButtonText>
                        </Button>

                        {!isArchived && (
                            <Button
                                variant="outline"
                                action="negative"
                                className="w-16 rounded-2xl h-14 border-error-200"
                                onPress={() => setShowDeleteAlert(true)}
                            >
                                <ButtonIcon as={Trash2} className="text-error-600" />
                            </Button>
                        )}
                    </HStack>
                </Box>
            </Box>
        </>
    );
}
