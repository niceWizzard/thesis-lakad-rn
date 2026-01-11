import Mapbox from '@rnmapbox/maps';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Edit2,
  Eye,
  History,
  MapPin,
  Navigation2,
  Star,
  Tag,
  Trash2,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Image, ScrollView, TouchableOpacity } from 'react-native';

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
import { Toast, ToastTitle, useToast } from '@/components/ui/toast';
import { VStack } from '@/components/ui/vstack';

import { supabase } from '@/src/utils/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export default function AdminLandmarkDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  // --- DATA FETCHING ---
  const { data: landmark, isLoading } = useQuery({
    queryKey: ['landmark', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landmark')
        .select('*')
        .eq('id', id as any)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // --- DELETE MUTATION ---
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (landmark?.image_url) {
        const path = landmark.image_url.split('/public/landmark_images/')[1];
        if (path) {
          await supabase.storage.from('landmark_images').remove([path]);
        }
      }
      const { error } = await supabase.from('landmark').delete().eq('id', id as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landmarks'] });
      toast.show({
        placement: "top",
        render: ({ id }) => (
          <Toast nativeID={id} action="success" variant="solid">
            <ToastTitle>Landmark Deleted Successfully</ToastTitle>
          </Toast>
        ),
      });
      router.back();
    },
  });

  if (isLoading) return <Box className="flex-1 justify-center items-center"><ActivityIndicator size="large" /></Box>;
  if (!landmark) return <Box className="flex-1 justify-center"><Text className="text-center">Landmark not found</Text></Box>;

  return (
    <>
      <Stack.Screen options={{
        headerTitle: "Landmark Management",
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <ArrowLeft color="black" size={24} />
          </TouchableOpacity>
        )
      }} />
      <Box className="flex-1 bg-background-0">


        {/* DELETE CONFIRMATION */}
        <AlertDialog isOpen={showDeleteAlert} onClose={() => setShowDeleteAlert(false)}>
          <AlertDialogBackdrop />
          <AlertDialogContent>
            <AlertDialogHeader>
              <Heading size="lg" className="text-error-600">Permanently Delete?</Heading>
            </AlertDialogHeader>
            <AlertDialogBody>
              <Text size="sm">
                This will remove "{landmark.name}" from the public app and delete its hosted image. This action cannot be undone.
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
                    deleteMutation.mutate();
                  }}
                >
                  <ButtonText>{deleteMutation.isPending ? "Deleting..." : "Delete"}</ButtonText>
                </Button>
              </ButtonGroup>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Status Bar */}
        <Box className="bg-background-50 p-4 border-b border-outline-100">
          <HStack className="justify-between items-center">
            <VStack>
              <Text size="xs" className="uppercase font-bold text-typography-400">Visibility</Text>
              <Badge action="success" variant="solid" className="rounded-md self-start mt-1">
                <BadgeText>LIVE ON APP</BadgeText>
              </Badge>
            </VStack>
            <Button
              variant="outline"
              action="secondary"
              size="xs"
              onPress={() => router.navigate(`/landmark/${landmark.id}/view`)}
            >
              <ButtonText>User View</ButtonText>
              <ButtonIcon as={Eye} className="ml-1" />
            </Button>
          </HStack>
        </Box>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <VStack className="p-6 gap-6">

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

              <Divider />

              <VStack className="gap-2">
                <HStack className="items-center gap-2">
                  <Icon as={Tag} size="xs" className="text-primary-600" />
                  <Text size="xs" className="font-bold text-typography-400 uppercase">Categories</Text>
                </HStack>
                <HStack space="xs" className="flex-wrap">
                  {landmark.categories?.map((cat: string) => (
                    <Badge key={cat} size="sm" variant="outline" action='info' className="rounded-lg">
                      <BadgeText>{cat}</BadgeText>
                    </Badge>
                  ))}
                </HStack>
              </VStack>
            </VStack>

            {/* 3. COORDINATES CARD */}
            <VStack space="md" className="bg-background-50 p-5 rounded-3xl border border-outline-100">
              <HStack className="items-center gap-2">
                <Icon as={Navigation2} size="sm" className="text-primary-600" />
                <Heading size="sm">Technical Coordinates</Heading>
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
                <VStack className="flex-1 bg-white p-3 rounded-xl border border-outline-50">
                  <Text size="xs" className="text-typography-400 font-bold uppercase mb-1">Lat</Text>
                  <Text size="sm" className="font-mono">{landmark.latitude}</Text>
                </VStack>
                <VStack className="flex-1 bg-white p-3 rounded-xl border border-outline-50">
                  <Text size="xs" className="text-typography-400 font-bold uppercase mb-1">Lng</Text>
                  <Text size="sm" className="font-mono">{landmark.longitude}</Text>
                </VStack>
              </HStack>
            </VStack>

            {/* 4. MAP PREVIEW CARD (RNMapbox) */}
            <VStack space="md" className="bg-background-50 p-2 rounded-3xl border border-outline-100 overflow-hidden">
              <Box className="h-48 w-full rounded-2xl overflow-hidden bg-background-200">
                <Mapbox.MapView
                  style={{ flex: 1 }}
                  zoomEnabled={false}
                  scrollEnabled={false} // Static feel for mini-map
                  logoEnabled={false}
                  attributionEnabled={false}
                >
                  <Mapbox.Camera
                    defaultSettings={{ centerCoordinate: [landmark.longitude, landmark.latitude], zoomLevel: 14, }}

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
              </Box>
            </VStack>

            {/* 5. DESCRIPTION PREVIEW */}
            <VStack className="gap-3">
              <Heading size="sm" className="ml-1">Historical Description</Heading>
              <Box className="bg-background-50 p-5 rounded-3xl border border-outline-100">
                <Text size="sm" className="leading-relaxed text-typography-700">{landmark.description}</Text>
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
                </VStack>
              </HStack>
            </Box>
          </VStack>
        </ScrollView>

        {/* FIXED ACTION BAR */}
        <Box className="p-6 bg-white border-t border-outline-50 shadow-lg">
          <HStack space="md">
            <Button
              className="flex-1 rounded-2xl h-14 bg-primary-600"
              onPress={() => router.push(`/(admin)/landmark/${landmark.id}/edit`)}
            >
              <ButtonIcon as={Edit2} className="mr-2" />
              <ButtonText className="font-bold">Edit Content</ButtonText>
            </Button>

            <Button
              variant="outline"
              action="negative"
              className="w-16 rounded-2xl h-14 border-error-200"
              onPress={() => setShowDeleteAlert(true)}
            >
              <ButtonIcon as={Trash2} className="text-error-600" />
            </Button>
          </HStack>
        </Box>
      </Box>
    </>
  );
}