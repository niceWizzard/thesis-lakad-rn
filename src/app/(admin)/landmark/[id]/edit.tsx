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
import { createAndEditLandmarkSchema } from '@/src/schema/landmark';
import { fetchLandmarkById } from '@/src/utils/fetchLandmarks';
import { supabase } from '@/src/utils/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';


type LandmarkFormData = z.infer<typeof createAndEditLandmarkSchema>;

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
        mutationFn: async ({ formData, pendingImageData }: { formData: LandmarkFormData, pendingImageData: { base64?: string, remoteUrl?: string } | null }) => {
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

            const { error } = await supabase.from('landmark').update({
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
            initialData={landmark}
            onSubmit={(data, img) => updateMutation.mutateAsync({ formData: data, pendingImageData: img })}
            isUpdating={updateMutation.isPending}
            submitLabel="Update Landmark"
            disregardDiscardDialog={disregardDiscardDialog}
        />
    )
}