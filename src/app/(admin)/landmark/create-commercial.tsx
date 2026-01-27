import { decode } from 'base64-arraybuffer';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import * as z from 'zod';


import { CommercialLandmarkForm } from '@/src/components/admin/CommercialForm';
import { useToastNotification } from '@/src/hooks/useToastNotification';
import { createAndEditCommercialLandmarkSchema } from '@/src/schema/commercial';
import { fetchCommercialLandmarks } from '@/src/utils/landmark/fetchCommercial';
import { createLandmark } from '@/src/utils/landmark/insertLandmark';
import { supabase } from '@/src/utils/supabase';
import { useMutation, useQueryClient } from '@tanstack/react-query';


type CreateFormData = z.infer<typeof createAndEditCommercialLandmarkSchema>;

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

            await createLandmark({
                name: formData.name,
                description: formData.description,
                latitude: parseFloat(formData.latitude),
                longitude: parseFloat(formData.longitude),
                district: formData.district,
                municipality: formData.municipality,
                gmaps_rating: parseFloat(formData.gmaps_rating || '0'),
                image_url: publicUrl,
                created_at: new Date().toISOString(),
                creation_type: "COMMERCIAL",
            })

            await queryClient.fetchQuery({ queryKey: ['commercial-landmarks'], queryFn: fetchCommercialLandmarks });
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
        <CommercialLandmarkForm
            onSubmit={(data, img) => createMutation.mutateAsync({ formData: data, pendingImageData: img })}
            isUpdating={createMutation.isPending}
            submitLabel="Publish Commercial"
            disregardDiscardDialog={disregardDiscardDialog}
        />
    )
}