import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Database,
  Edit2,
  Eye,
  History,
  Trash2
} from 'lucide-react-native';
import React from 'react';
import { Alert, Image, ScrollView, TouchableOpacity } from 'react-native';

import { Badge, BadgeText } from '@/components/ui/badge';
import { Box } from '@/components/ui/box';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Divider } from '@/components/ui/divider';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';

import { fetchLandmarkById } from '@/src/utils/fetchLandmarks';
import { useQuery } from '@tanstack/react-query';

export default function AdminLandmarkDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const { data: landmark, isLoading } = useQuery({
    queryKey: ['landmark', id],
    queryFn: () => fetchLandmarkById(Number.parseInt(id!.toString())),
    enabled: !!id,
  });

  const handleDelete = () => {
    Alert.alert(
      "Delete Landmark",
      "This action is permanent and will remove it for all users. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => console.log("Deleting...") }
      ]
    );
  };

  if (isLoading) return <Box className="flex-1 justify-center items-center"><Text>Loading Admin Data...</Text></Box>;
  if (!landmark) return <Box className="flex-1 justify-center"><Text className="text-center">Landmark not found</Text></Box>;

  const handlePreviewAsUser = () => {
    router.navigate({
      pathname: '/landmark/[id]/view',
      params: {
        id: landmark.id.toString(),
        previewMode: 'true',
      }
    })
  }

  const handleEditPress = () => {
    router.navigate({
      pathname: '/(admin)/landmark/[id]/edit',
      params: {
        id: landmark.id.toString(),
      }
    })
  }

  return (
    // flex-1 is required here to allow children to fill the screen
    <Box className="flex-1 bg-background-0">
      <Stack.Screen options={{
        headerTitle: "Admin View",
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <ArrowLeft color="black" size={24} />
          </TouchableOpacity>
        )
      }} />

      {/* 1. Admin Status Header (Fixed at top) */}
      <Box className="bg-background-50 p-4 border-b border-outline-100 z-10">
        <HStack className="justify-between items-center">
          <VStack>
            <Text size="xs" className="uppercase font-bold text-typography-400">Content Status</Text>
            <Badge action="success" variant="solid" className="rounded-md self-start mt-1">
              <BadgeText>ACTIVE / PUBLISHED</BadgeText>
            </Badge>
          </VStack>
          <Button variant="outline" action="secondary" size="xs" onPress={handlePreviewAsUser}>
            <ButtonText>Preview as User</ButtonText>
            <ButtonIcon as={Eye} className="ml-1" />
          </Button>
        </HStack>
      </Box>

      {/* 2. Scrollable Area */}
      {/* We use flex-1 to make the ScrollView take up all space between Header and Footer */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        // contentContainerStyle ensures padding at the bottom so content isn't hidden by the fixed footer
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <VStack className="p-6 gap-8">

          {/* Visual Content Check */}
          <VStack className="gap-4">
            <Image
              source={{ uri: 'https://via.placeholder.com/600x400' }}
              className="w-full h-64 rounded-3xl bg-background-100"
              resizeMode="cover"
            />
          </VStack>

          {/* Data Integrity Section */}
          <VStack className="gap-4">
            <Heading size="md">Core Information</Heading>
            <VStack space="md" className="bg-background-50 p-5 rounded-3xl border border-outline-100">
              <HStack className="justify-between">
                <Text size="sm" className="font-bold text-typography-500">Landmark ID</Text>
                <Text size="sm" className="font-mono text-primary-600 font-bold">#{landmark.id}</Text>
              </HStack>
              <Divider />
              <VStack className="gap-1">
                <Text size="xs" className="font-bold text-typography-400 uppercase">Display Name</Text>
                <Text size="lg" className="font-semibold text-typography-900">{landmark.name}</Text>
              </VStack>
            </VStack>
          </VStack>

          {/* Technical Metadata */}
          <VStack className="gap-4">
            <HStack className="items-center gap-2">
              <Icon as={Database} size="sm" className="text-primary-600" />
              <Heading size="md">Technical Details</Heading>
            </HStack>

            <HStack space="md">
              <VStack className="flex-1 bg-background-50 p-5 rounded-3xl border border-outline-100">
                <Text size="xs" className="text-typography-400 font-bold uppercase mb-1">Latitude</Text>
                <Text size="md" className="font-medium">{landmark.latitude.toFixed(6)}</Text>
              </VStack>
              <VStack className="flex-1 bg-background-50 p-5 rounded-3xl border border-outline-100">
                <Text size="xs" className="text-typography-400 font-bold uppercase mb-1">Longitude</Text>
                <Text size="md" className="font-medium">{landmark.longitude.toFixed(6)}</Text>
              </VStack>
            </HStack>
          </VStack>

          {/* Audit Logs / Timestamp */}
          <Box className="bg-secondary-50 p-5 rounded-3xl border border-secondary-100">
            <HStack space="sm" className="items-center">
              <Icon as={History} size="sm" className="text-secondary-600" />
              <VStack>
                <Text size="xs" className="text-secondary-700 font-bold">Audit Log</Text>
                <Text size="xs" className="text-secondary-600">Last modified by Admin on Jan 10, 2026</Text>
              </VStack>
            </HStack>
          </Box>
        </VStack>
      </ScrollView>

      {/* 3. Fixed Admin Action Bar (Outside ScrollView) */}
      <Box className="p-6 bg-background-0 border-t border-outline-50 shadow-lg">
        <HStack space="md">
          <Button
            className="flex-1 rounded-2xl h-14 bg-primary-600 shadow-soft-2"
            onPress={handleEditPress}
          >
            <ButtonIcon as={Edit2} className="mr-2" />
            <ButtonText className="font-bold">Edit Details</ButtonText>
          </Button>

          <Button
            variant="outline"
            action="negative"
            className="w-16 rounded-2xl h-14 border-error-300"
            onPress={handleDelete}
          >
            <ButtonIcon as={Trash2} className="text-error-600" />
          </Button>
        </HStack>
      </Box>
    </Box>
  );
}