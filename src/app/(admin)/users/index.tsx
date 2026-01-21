import { useRouter } from 'expo-router';
import {
    Check,
    ChevronRight,
    Filter,
    Mail,
    Search,
    ShieldCheck,
    User,
    UserX,
    X,
    Zap
} from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';

import { Badge, BadgeText } from '@/components/ui/badge';
import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import {
    Modal,
    ModalBackdrop,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader
} from '@/components/ui/modal';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';

import { supabase } from '@/src/utils/supabase';
import { useQuery } from '@tanstack/react-query';

type UserType = 'All' | 'Regular' | 'Admin' | 'SuperAdmin';

export default function AdminUserSearchScreen() {
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [typeFilter, setTypeFilter] = useState<UserType>('All');

    const router = useRouter();

    const { data: users = [], isLoading, refetch } = useQuery({
        queryKey: ['admin_user_search', searchQuery, typeFilter],
        queryFn: async () => {
            let query = supabase
                .from('profiles')
                .select(`*`)
                .order('created_at', { ascending: false });

            if (typeFilter !== 'All') {
                query = query.eq('user_type', typeFilter);
            }

            if (searchQuery.trim()) {
                const trimmedSearch = searchQuery.trim();
                const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trimmedSearch);
                let searchFilter = `email.ilike.%${trimmedSearch}%,full_name.ilike.%${trimmedSearch}%`;

                if (isUUID) {
                    searchFilter += `,user_id.eq.${trimmedSearch}`;
                }
                query = query.or(searchFilter);
            }

            const { data, error } = await query.limit(50);
            if (error) throw error;
            return data;
        },
    });

    const getBadgeConfig = (type: string) => {
        switch (type) {
            case 'SuperAdmin': return { action: 'error', label: 'Super' };
            case 'Admin': return { action: 'info', label: 'Admin' };
            default: return { action: 'muted', label: 'Regular' };
        }
    };

    const handleReset = () => {
        setSearchQuery('');
        setTypeFilter('All');
        setShowFilterModal(false);
    };

    const handleFilterTypePress = (type: UserType) => {
        setTypeFilter(type);
        setShowFilterModal(false);
    };


    return (
        <Box className="flex-1 bg-background-0">
            <VStack className="flex-1">
                {/* --- HEADER SECTION --- */}
                <Box className="p-4 bg-background-50 border-b border-outline-100 gap-4">
                    <Input variant="rounded" size="lg" className="bg-background-0 border-outline-200">
                        <InputSlot className="pl-4">
                            <InputIcon as={Search} />
                        </InputSlot>
                        <InputField
                            placeholder="Search Name or Email..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <InputSlot className="pr-4" onPress={() => setSearchQuery('')}>
                                <InputIcon as={X} size="sm" />
                            </InputSlot>
                        )}
                    </Input>

                    <HStack className="justify-between items-center px-1">
                        <HStack space="xs" className="items-center">
                            <Text size="xs" className="font-bold text-typography-500 uppercase tracking-wider">
                                {isLoading ? 'Searching...' : `${typeFilter} (${users.length})`}
                            </Text>
                        </HStack>

                        <TouchableOpacity
                            onPress={() => setShowFilterModal(true)}
                            className="flex-row items-center gap-2 bg-primary-50 px-4 py-2 rounded-full border border-primary-100"
                        >
                            <Icon as={Filter} size="xs" className="text-primary-600" />
                            <Text size="xs" className="text-primary-600 font-bold">Filter</Text>
                        </TouchableOpacity>
                    </HStack>
                </Box>

                {/* --- LIST SECTION --- */}
                {isLoading ? (
                    <Box className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color="#4f46e5" />
                    </Box>
                ) : (
                    <FlatList
                        data={users}
                        keyExtractor={(item) => item.user_id}
                        contentContainerClassName="p-4 pb-32 gap-3"
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item: profile }) => {
                            const config = getBadgeConfig(profile.user_type);
                            return (
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => router.navigate(`/(admin)/users/${profile.user_id}/edit`)}
                                    className="bg-background-0 p-4 rounded-3xl border border-outline-100 shadow-soft-1"
                                >
                                    <HStack className="justify-between items-center">
                                        <VStack className="flex-1 gap-1">
                                            <HStack space="xs" className="items-center">
                                                <Text className="font-bold text-typography-900">{profile.full_name || 'No Name'}</Text>
                                                <Badge action={config.action as any} variant="solid" className="rounded-full px-2 py-0">
                                                    <BadgeText size="sm" className="font-bold uppercase">{config.label}</BadgeText>
                                                </Badge>
                                            </HStack>
                                            <HStack className="items-center gap-1">
                                                <Icon as={Mail} size="xs" className="text-typography-400" />
                                                <Text size="xs" className="text-typography-500">{profile.email}</Text>
                                            </HStack>
                                        </VStack>
                                        <Icon as={ChevronRight} size="sm" className="text-typography-300" />
                                    </HStack>
                                </TouchableOpacity>
                            );
                        }}
                        ListEmptyComponent={
                            <VStack className="items-center justify-center py-24 px-10 gap-6">
                                <Box className="bg-background-50 p-8 rounded-full">
                                    <Icon as={UserX} size="xl" className="text-typography-200" />
                                </Box>
                                <VStack space="xs" className="items-center">
                                    <Heading size="md" className="text-center">No results found</Heading>
                                    <Text size="sm" className="text-center text-typography-500 leading-5">
                                        We couldn't find any users matching your criteria. Try adjusting your filters or search terms.
                                    </Text>
                                </VStack>

                                {(searchQuery !== '' || typeFilter !== 'All') && (
                                    <Button
                                        variant="outline"
                                        action="primary"
                                        onPress={handleReset}
                                        className="rounded-2xl"
                                    >
                                        <ButtonText>Clear All Filters</ButtonText>
                                    </Button>
                                )}
                            </VStack>
                        }
                    />
                )}
            </VStack>

            {/* --- FILTER MODAL --- */}
            <Modal isOpen={showFilterModal} onClose={() => setShowFilterModal(false)}>
                <ModalBackdrop />
                <ModalContent className="rounded-[40px] p-2">
                    <ModalHeader className="px-4 pt-4">
                        <VStack>
                            <Heading size="xl">Filter Users</Heading>
                            <Text size="sm" className="text-typography-500">Select user access level</Text>
                        </VStack>
                        <ModalCloseButton>
                            <Icon as={X} />
                        </ModalCloseButton>
                    </ModalHeader>

                    <ModalBody className="px-4 py-6">
                        <VStack space="md">
                            {(['All', 'Regular', 'Admin', 'SuperAdmin'] as UserType[]).map((option) => (
                                <TouchableOpacity
                                    key={option}
                                    onPress={() => handleFilterTypePress(option)}
                                    className={`p-4 rounded-2xl border-2 ${typeFilter === option ? 'bg-primary-50 border-primary-500' : 'bg-background-50 border-transparent'}`}
                                >
                                    <HStack className="justify-between items-center">
                                        <HStack space="md" className="items-center">
                                            <Box className={`p-2 rounded-lg ${typeFilter === option ? 'bg-primary-500' : 'bg-background-200'}`}>
                                                <Icon
                                                    as={option === 'SuperAdmin' ? Zap : option === 'Admin' ? ShieldCheck : User}
                                                    size="xs"
                                                    color={typeFilter === option ? "white" : "#6b7280"}
                                                />
                                            </Box>
                                            <Text className={`font-bold ${typeFilter === option ? 'text-primary-700' : 'text-typography-700'}`}>
                                                {option === 'All' ? 'Every User' : option}
                                            </Text>
                                        </HStack>
                                        {typeFilter === option && <Icon as={Check} size="sm" className="text-primary-600" />}
                                    </HStack>
                                </TouchableOpacity>
                            ))}
                        </VStack>
                    </ModalBody>

                    <ModalFooter className="mx-2 my-4">
                        <Button
                            variant="outline"
                            action="secondary"
                            onPress={handleReset}
                            className="flex-1 rounded-2xl h-12"
                        >
                            <ButtonText>Reset</ButtonText>
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
}