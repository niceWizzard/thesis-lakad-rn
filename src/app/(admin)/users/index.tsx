import { Stack, useRouter } from 'expo-router';
import {
    ChevronRight,
    Copy,
    Filter,
    Fingerprint,
    Mail,
    Search,
    User,
    X
} from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Clipboard, FlatList, TouchableOpacity } from 'react-native';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { Toast, ToastTitle, useToast } from '@/components/ui/toast';
import { VStack } from '@/components/ui/vstack';

import { Icon } from '@/components/ui/icon';
import { supabase } from '@/src/utils/supabase';
import { useQuery } from '@tanstack/react-query';

export default function AdminUserSearchScreen() {
    const [searchQuery, setSearchQuery] = useState('');
    const toast = useToast();
    const router = useRouter()

    const { data: users = [], isLoading } = useQuery({
        queryKey: ['admin_user_search', searchQuery],
        queryFn: async () => {
            let query = supabase
                .from('profiles')
                .select(`*`)
                .order('created_at', { ascending: false });

            if (searchQuery.trim()) {
                const trimmedSearch = searchQuery.trim();

                // Regex to check if the string follows UUID format
                const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trimmedSearch);

                // Base search for name and email
                let searchFilter = `email.ilike.%${trimmedSearch}%,full_name.ilike.%${trimmedSearch}%`;

                // Only add user_id filter if it's a valid UUID to avoid 22P02 error
                if (isUUID) {
                    searchFilter += `,user_id.eq.${trimmedSearch}`;
                }

                query = query.or(searchFilter);
            }

            const { data, error } = await query.limit(50);
            if (error) throw error;
            return data;
        },
        // Only run the query if search is empty (initial load) or length > 2
        enabled: true
    });

    const copyToClipboard = (text: string) => {
        Clipboard.setString(text);
        toast.show({
            placement: "top",
            render: ({ id }) => (
                <Toast nativeID={id} action="info" variant="solid">
                    <ToastTitle>ID Copied to Clipboard</ToastTitle>
                </Toast>
            ),
        });
    };

    const handleItemUserPress = (user_id: string) => {
        router.navigate({
            pathname: '/(admin)/users/[id]/edit',
            params: { id: user_id },
        });
    }

    return (
        <Box className="flex-1 bg-background-0">
            <Stack.Screen options={{ headerTitle: "User Directory" }} />

            <VStack className="flex-1">
                {/* Search Header Section */}
                <Box className="p-4 bg-background-50 border-b border-outline-100 gap-4">
                    <Input variant="rounded" size="lg" className="bg-background-0 border-outline-200">
                        <InputSlot className="pl-4">
                            <InputIcon as={Search} className="text-typography-400" />
                        </InputSlot>
                        <InputField
                            placeholder="Search Name, Email, or UUID..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <InputSlot className="pr-4" onPress={() => setSearchQuery('')}>
                                <InputIcon as={X} />
                            </InputSlot>
                        )}
                    </Input>

                    <HStack className="justify-between items-center px-1">
                        <Text size="xs" className="font-bold text-typography-500 uppercase">
                            {isLoading ? 'Searching...' : `Found ${users.length} Users`}
                        </Text>
                        <TouchableOpacity className="flex-row items-center gap-1">
                            <Icon as={Filter} size="xs" className="text-primary-600" />
                            <Text size="xs" className="text-primary-600 font-bold">Filters</Text>
                        </TouchableOpacity>
                    </HStack>
                </Box>

                {isLoading ? (
                    <Box className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color="#4f46e5" />
                    </Box>
                ) : (
                    <FlatList
                        data={users}
                        keyExtractor={(item) => item.user_id}
                        contentContainerClassName="p-4 pb-20 gap-3"
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item: profile }) => (
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => handleItemUserPress(profile.user_id)}
                                className="bg-background-0 p-4 rounded-3xl border border-outline-100 shadow-soft-1"
                            >
                                <HStack className="justify-between items-center">
                                    <HStack space="md" className="items-center flex-1">
                                        <VStack className="flex-1 gap-1">
                                            <Text className="font-bold text-typography-900" numberOfLines={1}>
                                                {profile.full_name || 'Unnamed User'}
                                            </Text>

                                            <HStack className="items-center gap-1">
                                                <Mail size={12} className="text-typography-400" />
                                                <Text size="xs" className="text-typography-500" numberOfLines={1}>
                                                    {profile.email}
                                                </Text>
                                            </HStack>

                                            <TouchableOpacity
                                                onPress={() => copyToClipboard(profile.user_id)}
                                                className="flex-row items-center gap-1 mt-1 self-start"
                                            >
                                                <Fingerprint size={12} className="text-primary-500" />
                                                <Text size="xs" className="text-primary-600 font-mono" numberOfLines={1}>
                                                    {profile.user_id.substring(0, 18)}...
                                                </Text>
                                                <Copy size={10} className="text-primary-400" />
                                            </TouchableOpacity>
                                        </VStack>
                                    </HStack>

                                    <Icon as={ChevronRight} size="sm" className="text-typography-300" />
                                </HStack>
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={
                            <VStack className="items-center py-20 gap-2">
                                <Icon as={User} size="xl" className="text-typography-200" />
                                <Text className="text-typography-400">No users match your search</Text>
                            </VStack>
                        }
                    />
                )}
            </VStack>
        </Box>
    );
}