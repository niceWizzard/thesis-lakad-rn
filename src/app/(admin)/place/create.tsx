import { formatTime } from '@/src/utils/dateUtils';
import { decode } from 'base64-arraybuffer';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import * as z from 'zod';

import { LandmarkForm } from '@/src/components/admin/LandmarkForm';
import { QueryKey } from '@/src/constants/QueryKey';
import { useToastNotification } from '@/src/hooks/useToastNotification';
import { Place } from '@/src/model/places.types';
import { createAndEditLandmarkSchema } from '@/src/schema/landmark';
import { calculateIncrementalMatrix } from '@/src/utils/distance/calculateIncrementalMatrix';
import { createPlace } from '@/src/utils/landmark/insertLandmark';
import { supabase } from '@/src/utils/supabase';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type CreateFormData = z.infer<typeof createAndEditLandmarkSchema>;

const normalizeName = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '').trim();

export default function AdminLandmarkCreateScreen() {
    const router = useRouter();
    const { showToast } = useToastNotification();
    const queryClient = useQueryClient();
    const [disregardDiscardDialog, setDisregardDiscardDialog] = useState(false);

    const createMutation = useMutation({
        mutationFn: async ({ formData, pendingImageData }: { formData: CreateFormData, pendingImageData: { base64?: string, remoteUrl?: string } | null }) => {
            if (!pendingImageData) throw new Error('Please select an image first');

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

            // --- Duplicate name guard (non-soft-deleted places only) ---
            const { data: activePlaces, error: nameCheckError } = await supabase
                .from('places')
                .select('id, name')
                .is('deleted_at', null);

            if (nameCheckError) throw nameCheckError;

            const normalizedInput = normalizeName(formData.name);
            const nameMatch = activePlaces?.find(p => normalizeName(p.name) === normalizedInput);

            if (nameMatch) {
                throw new Error(
                    `A place named "${nameMatch.name}" already exists. Please use a different name.`
                );
            }

            const id = await createPlace({
                name: formData.name,
                description: formData.description,
                latitude: parseFloat(formData.latitude),
                longitude: parseFloat(formData.longitude),
                type: formData.is_verified !== false ? formData.type : null,
                unverified_type: formData.is_verified === false ? formData.unverified_type : null,
                district: formData.district,
                municipality: formData.municipality,
                gmaps_rating: parseFloat(formData.gmaps_rating || '0'),
                image_url: publicUrl,
                is_verified: formData.is_verified ?? true,
                created_at: new Date().toISOString(),
            });

            // Insert Opening Hours
            if (formData.opening_hours) {
                const hoursToInsert = formData.opening_hours.map(h => ({
                    place_id: id,
                    day_of_week: h.day_of_week,
                    opens_at: formatTime(h.opens_at) || null,
                    closes_at: formatTime(h.closes_at) || null,
                    is_closed: h.is_closed,
                }));

                const { error: hoursError } = await supabase.from('opening_hours').insert(hoursToInsert);
                if (hoursError) throw hoursError;
            }

            // Create distance matrix for new landmark
            const landmarks = await queryClient.getQueryData<Place[]>([QueryKey.ALL_LANDMARKS]);
            if (!landmarks) throw new Error('No landmarks found');

            const { inbound, outbound, sourceId } = await calculateIncrementalMatrix({
                newWaypoint: {
                    id: id.toString(),
                    coords: [parseFloat(formData.longitude), parseFloat(formData.latitude)],
                },
                existingWaypoints: landmarks.map(v => ({
                    coords: [v.longitude, v.latitude],
                    id: v.id.toString(),
                })),
            });

            const dataToUpsert = [
                ...Object.keys(outbound)
                    .filter(destId => destId !== sourceId)
                    .map(destId => ({
                        source: Number(sourceId),
                        destination: Number(destId),
                        distance: outbound[destId],
                    })),
                ...Object.keys(inbound)
                    .filter(srcId => srcId !== sourceId)
                    .map(srcId => ({
                        source: Number(srcId),
                        destination: Number(sourceId),
                        distance: inbound[srcId],
                    })),
            ];

            if (dataToUpsert.length > 0) {
                const { error: upsertError } = await supabase
                    .from('distances')
                    .upsert(dataToUpsert, { onConflict: 'source, destination' });

                if (upsertError) {
                    throw upsertError;
                }
            }

            await queryClient.invalidateQueries({ queryKey: [QueryKey.ALL_LANDMARKS] });
            if (formData.is_verified === false) {
                await queryClient.invalidateQueries({ queryKey: [QueryKey.UNVERIFIED_LANDMARKS] });
            } else {
                await queryClient.invalidateQueries({ queryKey: [QueryKey.VERIFIED_LANDMARKS] });
            }
        },
        onSuccess: () => {
            showToast({ title: 'Landmark Published!' });
            setDisregardDiscardDialog(true);
            setTimeout(() => { router.back(); }, 100);
        },
        onError: (error: any) => {
            showToast({
                title: 'Failed to create landmark',
                description: error.message,
                action: 'error',
            });
        },
    });

    return (
        <LandmarkForm
            onSubmit={(data, img) => createMutation.mutateAsync({ formData: data, pendingImageData: img })}
            isUpdating={createMutation.isPending}
            submitLabel="Publish Landmark"
            disregardDiscardDialog={disregardDiscardDialog}
        />
    );
}