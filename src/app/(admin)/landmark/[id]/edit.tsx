import { formatTime } from '@/src/utils/dateUtils';
import { decode } from 'base64-arraybuffer';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator
} from 'react-native';
import * as z from 'zod';

import { Box } from '@/components/ui/box';

import { LandmarkForm } from '@/src/components/admin/LandmarkForm';
import { useToastNotification } from '@/src/hooks/useToastNotification';
import { Place } from '@/src/model/places.types';
import { createAndEditLandmarkSchema } from '@/src/schema/landmark';
import { calculateIncrementalMatrix } from '@/src/utils/distance/calculateIncrementalMatrix';
import { fetchLandmarkById } from '@/src/utils/landmark/fetchLandmarks';
import { supabase } from '@/src/utils/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';


type PlaceFormData = z.infer<typeof createAndEditLandmarkSchema>;

export default function AdminLandmarkEditScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { showToast } = useToastNotification();
    const queryClient = useQueryClient();
    const [disregardDiscardDialog, setDisregardDiscardDialog] = useState(false)


    const { data: landmark, isLoading } = useQuery({
        queryKey: ['landmark', id],
        queryFn: () => fetchLandmarkById(id.toString()),
        enabled: !!id,
    });



    const updateMutation = useMutation({
        mutationFn: async ({ formData, pendingImageData }: { formData: PlaceFormData, pendingImageData: { base64?: string, remoteUrl?: string } | null }) => {
            let finalImageUrl = landmark?.image_url;
            if (pendingImageData) {
                let arrayBuffer: ArrayBuffer;
                let contentType: string;
                let fileExt: string;

                if (pendingImageData.base64) {
                    arrayBuffer = decode(pendingImageData.base64);
                    contentType = 'image/jpeg';
                    fileExt = 'jpg';
                } else {
                    const response = await fetch(pendingImageData.remoteUrl!);
                    const blob = await response.blob();
                    arrayBuffer = await new Response(blob).arrayBuffer();
                    contentType = blob.type || 'image/jpeg';
                    fileExt = pendingImageData.remoteUrl!.split('.').pop()?.split(/[?#]/)[0] || 'jpg';
                }

                const fileName = `${Date.now()}.${fileExt}`;
                const filePath = `landmarks/${fileName}`;
                const { error: uploadError } = await supabase.storage.from('landmark_images').upload(filePath, arrayBuffer, { contentType });
                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage.from('landmark_images').getPublicUrl(filePath);
                finalImageUrl = publicUrl;

                if (landmark?.image_url) {
                    const pathToDelete = landmark.image_url.split('/public/landmark_images/')[1];
                    if (pathToDelete) await supabase.storage.from('landmark_images').remove([pathToDelete]);
                }
            }

            const { error } = await supabase.from('places').update({
                name: formData.name,
                description: formData.description,
                latitude: parseFloat(formData.latitude),
                longitude: parseFloat(formData.longitude),
                type: formData.type,
                district: formData.district,
                municipality: formData.municipality,
                gmaps_rating: parseFloat(formData.gmaps_rating || '0'),
                image_url: finalImageUrl,
                updated_at: new Date().toISOString(),
            }).eq('id', id as any);
            if (error) throw error;

            // Update Opening Hours
            if (formData.opening_hours) {
                const landmarkId = Number(id);
                if (isNaN(landmarkId)) throw new Error("Invalid Landmark ID");

                // Upsert new hours
                const hoursToUpsert = formData.opening_hours.map(h => ({
                    place_id: landmarkId,
                    day_of_week: h.day_of_week,
                    opens_at: formatTime(h.opens_at) || null,
                    closes_at: formatTime(h.closes_at) || null,
                    is_closed: h.is_closed
                }));

                const { error: upsertError } = await supabase
                    .from('opening_hours')
                    .upsert(hoursToUpsert, { onConflict: 'place_id, day_of_week' });

                if (upsertError) throw upsertError;
            }

            const hasLocationChanged = formData.latitude !== landmark?.latitude.toString() || formData.longitude !== landmark?.longitude.toString();
            if (hasLocationChanged) {
                const landmarks = await queryClient.fetchQuery<Place[]>({ queryKey: ['landmarks'] })
                const { inbound, outbound, sourceId } = await calculateIncrementalMatrix({
                    newWaypoint: {
                        id: id.toString(),
                        coords: [parseFloat(formData.longitude), parseFloat(formData.latitude)],
                    },
                    existingWaypoints: landmarks.filter(v => v.id !== Number(id)).map(v => ({
                        coords: [v.longitude, v.latitude],
                        id: v.id.toString(),
                    }))
                });

                // 1. Combine both directions into a single data array
                const dataToUpsert = [
                    // Outbound: New -> Others
                    ...Object.keys(outbound)
                        .filter(destId => destId !== sourceId) // Avoid self-to-self
                        .map(destId => ({
                            source: Number(sourceId),
                            destination: Number(destId),
                            distance: outbound[destId],
                        })),
                    // Inbound: Others -> New
                    ...Object.keys(inbound)
                        .filter(srcId => srcId !== sourceId) // Avoid self-to-self
                        .map(srcId => ({
                            source: Number(srcId),
                            destination: Number(sourceId),
                            distance: inbound[srcId],
                        }))
                ];

                // 2. Only proceed if there is data (prevents error on the first landmark)
                if (dataToUpsert.length > 0) {
                    const { error: upsertError } = await supabase
                        .from("distances")
                        .upsert(dataToUpsert, {
                            onConflict: "source, destination"
                        });

                    if (upsertError) {
                        console.error("Failed to update distance matrix:", upsertError);
                        throw upsertError;
                    }
                }

            }

            await queryClient.refetchQueries({ queryKey: ['landmarks'], });
        },
        onSuccess: async () => {
            queryClient.invalidateQueries({ queryKey: ['landmark', id] });
            showToast({
                title: "Landmark Updated!",
            })
            setDisregardDiscardDialog(true);
            setTimeout(() => {
                router.back();
            })

        },
    });

    if (isLoading) return <Box className="flex-1 justify-center items-center"><ActivityIndicator size="large" /></Box>;

    return (
        <LandmarkForm
            initialData={landmark ?? undefined}
            onSubmit={(data, img) => updateMutation.mutateAsync({ formData: data, pendingImageData: img })}
            isUpdating={updateMutation.isPending}
            submitLabel="Update Landmark"
            disregardDiscardDialog={disregardDiscardDialog}
        />
    )
}