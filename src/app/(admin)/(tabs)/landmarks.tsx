import { Stack, useRouter } from 'expo-router';
import {
    ChevronRight,
    Image as ImageIcon,
    MapPin,
    Navigation,
    Plus,
    Search
} from 'lucide-react-native';
import React, { useState } from 'react';
import { FlatList, Image, RefreshControl, ScrollView, TouchableOpacity, View } from 'react-native';

import { Badge, BadgeText } from '@/components/ui/badge';
import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';

import { Fab, FabIcon, FabLabel } from '@/components/ui/fab';
import ItinerarySkeleton from '@/src/components/ItinerarySkeleton';
import { Landmark } from '@/src/model/landmark.types';
import { useAuthStore } from '@/src/stores/useAuth';
import { fetchLandmarks } from '@/src/utils/fetchLandmarks';
import { useQuery } from '@tanstack/react-query';

export default function AdminLandmarksScreen() {
    const [searchString, setSearchString] = useState('');
    const auth = useAuthStore();
    const userId = auth.session?.user?.id;
    const router = useRouter();

    const {
        data: landmarks = [],
        isLoading,
        isRefetching,
        refetch
    } = useQuery<Landmark[]>({
        queryKey: ['landmarks'],
        queryFn: fetchLandmarks,
        enabled: !!userId,
    });

    const filteredLandmarks = landmarks.filter(v =>
        v.name.toLowerCase().includes(searchString.toLowerCase())
    );


    const handleCreatePress = () => {
        router.navigate('/(admin)/landmark/create');
    };


    // --- 1. ADMIN LOADING STATE ---
    if (isLoading && landmarks.length === 0) {
        return (
            <Box className="flex-1 bg-background-0">
                <Stack.Screen options={{ headerTitle: "Manage Content" }} />
                <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="p-6 gap-6">
                    <Box className="h-12 w-full bg-background-100 rounded-2xl mb-2" />
                    {[1, 2, 3, 4].map((i) => <ItinerarySkeleton key={i} />)}
                </ScrollView>
            </Box>
        );
    }

    // --- 2. ADMIN EMPTY STATE ---
    if (!isLoading && landmarks.length === 0) {
        return (
            <Box className="flex-1 bg-background-0 justify-center items-center p-10">
                <Stack.Screen options={{ headerTitle: "Manage Content" }} />
                <View className="bg-primary-50 p-6 rounded-full mb-6">
                    <Icon as={MapPin} size="xl" className="text-primary-600" />
                </View>
                <Heading size="xl" className="text-center mb-2">No Landmarks Yet</Heading>
                <Text className="text-center text-typography-500 mb-8">
                    The database is currently empty. Start by adding a new historical landmark.
                </Text>
                <Button size="lg" className="rounded-2xl" onPress={() => { }}>
                    <ButtonText>Add First Landmark</ButtonText>
                </Button>
            </Box>
        );
    }

    // --- 3. ADMIN DATA LIST ---
    return (
        <Box className="flex-1 bg-background-0">
            <Stack.Screen options={{ headerTitle: "Manage Landmarks" }} />

            <FlatList
                data={filteredLandmarks}
                keyExtractor={(item) => `landmark-${item.id}`}
                showsVerticalScrollIndicator={false}
                contentContainerClassName="p-6 pb-32 gap-4"
                refreshControl={
                    <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#4f46e5" />
                }
                ListHeaderComponent={
                    <VStack className="mb-2 gap-4">
                        <Input variant="rounded" size="lg" className="border-none bg-background-100 h-12 rounded-2xl">
                            <InputSlot className="pl-4">
                                <InputIcon as={Search} className="text-typography-400" />
                            </InputSlot>
                            <InputField
                                placeholder="Search landmarks..."
                                value={searchString}
                                onChangeText={setSearchString}
                                className="text-typography-900"
                            />
                        </Input>
                        <HStack className="justify-between items-center px-1">
                            <Text size="sm" className="text-typography-500 font-bold uppercase tracking-wider">
                                {filteredLandmarks.length} Results
                            </Text>
                        </HStack>
                    </VStack>
                }
                renderItem={({ item: landmark }) => (
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => {
                            router.navigate({
                                pathname: '/(admin)/landmark/[id]',
                                params: {
                                    id: landmark.id.toString()
                                }
                            })
                        }}
                        className="bg-background-50 rounded-3xl border border-outline-100 shadow-soft-1 overflow-hidden"
                    >
                        <HStack className="p-4 items-center gap-4">
                            {/* Thumbnail */}
                            <Box className="w-20 h-20 bg-background-200 rounded-2xl overflow-hidden border border-outline-50">
                                {true ? (
                                    <Image
                                        source={{ uri: "https://media-cdn.tripadvisor.com/media/photo-s/0f/48/5c/af/random-location.jpg" }}
                                        className="w-full h-full"
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View className="flex-1 justify-center items-center">
                                        <ImageIcon size={20} className="text-typography-300" />
                                    </View>
                                )}
                            </Box>

                            {/* Info */}
                            <VStack className="flex-1 gap-1">
                                <Badge action="info" variant="solid" className="self-start rounded-md px-2 py-0">
                                    <BadgeText className="text-[10px] uppercase font-bold">Historical</BadgeText>
                                </Badge>
                                <Heading size="md" className="text-typography-900" numberOfLines={1}>
                                    {landmark.name}
                                </Heading>
                                <HStack className="items-center gap-1">
                                    <Navigation size={12} className="text-typography-400" />
                                    <Text size="xs" className="text-typography-500">
                                        {landmark.latitude.toFixed(4)}, {landmark.longitude.toFixed(4)}
                                    </Text>
                                </HStack>
                            </VStack>

                            {/* Action Icon */}
                            <Icon as={ChevronRight} className="text-typography-300 mr-1" />
                        </HStack>
                    </TouchableOpacity>
                )}
            />

            {/* Admin specific FAB */}
            <Fab
                size="lg"
                placement="bottom right"
                onPress={handleCreatePress}
            >
                <FabIcon as={Plus} />
                <FabLabel>New</FabLabel>
            </Fab>
        </Box>
    );
}