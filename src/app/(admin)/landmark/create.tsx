import { decode } from 'base64-arraybuffer';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import * as z from 'zod';


import { LandmarkForm } from '@/src/components/admin/LandmarkForm';
import { useToastNotification } from '@/src/hooks/useToastNotification';
import { Landmark } from '@/src/model/landmark.types';
import { createAndEditLandmarkSchema } from '@/src/schema/landmark';
import { calculateIncrementalMatrix } from '@/src/utils/distance/calculateIncrementalMatrix';
import { fetchLandmarks } from '@/src/utils/landmark/fetchLandmarks';
import { createLandmark } from '@/src/utils/landmark/insertLandmark';
import { supabase } from '@/src/utils/supabase';
import { useMutation, useQueryClient } from '@tanstack/react-query';


type CreateFormData = z.infer<typeof createAndEditLandmarkSchema>;

export default function AdminLandmarkCreateScreen() {
    const router = useRouter();
    const { showToast } = useToastNotification();
    const queryClient = useQueryClient();
    const [disregardDiscardDialog, setDisregardDiscardDialog] = useState(false)


    const createMutation = useMutation({
        mutationFn: async ({ formData, pendingImageData }: { formData: CreateFormData, pendingImageData: { base64?: string, remoteUrl?: string } | null }) => {
            if (!pendingImageData) throw new Error("Please select an image first");

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

            const { error: uploadError } = await supabase.storage
                .from('landmark_images')
                .upload(filePath, arrayBuffer, { contentType });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('landmark_images').getPublicUrl(filePath);

            const id = await createLandmark({
                name: formData.name,
                description: formData.description,
                latitude: parseFloat(formData.latitude),
                longitude: parseFloat(formData.longitude),
                type: formData.type,
                district: formData.district,
                municipality: formData.municipality,
                gmaps_rating: parseFloat(formData.gmaps_rating || '0'),
                image_url: publicUrl,
                created_at: new Date().toISOString(),
            })

            // Create distance matrix for new landmark

            const landmarks = await queryClient.fetchQuery<Landmark[]>({ queryKey: ['landmarks'] })

            const { inbound, outbound, sourceId } = await calculateIncrementalMatrix({
                newWaypoint: {
                    id: id.toString(),
                    coords: [parseFloat(formData.longitude), parseFloat(formData.latitude)],
                },
                existingWaypoints: landmarks.map(v => ({
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


            await queryClient.fetchQuery({ queryKey: ['landmarks'], queryFn: fetchLandmarks });
        },
        onSuccess: () => {
            showToast({
                title: "Landmark Published!",
            })
            setDisregardDiscardDialog(true);
            setTimeout(() => {
                router.back();
            }, 100)
        },
        onError: (error: any) => {
            alert(error.message || "Failed to create landmark");
        }
    });

    return (
        <LandmarkForm
            onSubmit={(data, img) => createMutation.mutateAsync({ formData: data, pendingImageData: img })}
            isUpdating={createMutation.isPending}
            submitLabel="Publish Landmark"
            disregardDiscardDialog={disregardDiscardDialog}
        />
    )
}