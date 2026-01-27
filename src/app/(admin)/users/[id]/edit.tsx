import { useLocalSearchParams } from 'expo-router';
import {
    Mail,
    ShieldCheck,
    ShieldOff,
    User as UserIcon
} from 'lucide-react-native';
import React from 'react';
import { Alert, ScrollView } from 'react-native';

import { Badge, BadgeText } from '@/components/ui/badge';
import { Box } from '@/components/ui/box';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Divider } from '@/components/ui/divider';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';

import { Center } from '@/components/ui/center';
import { useToastNotification } from '@/src/hooks/useToastNotification';
import { supabase } from '@/src/utils/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export default function AdminUserEditScreen() {
    // id is the user_id passed from the search screen
    const { id } = useLocalSearchParams();
    const { showToast } = useToastNotification();
    const queryClient = useQueryClient();

    // 1. Fetch current user data
    const { data: profile, isLoading } = useQuery({
        queryKey: ['admin_user_detail', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', id as any)
                .single();
            if (error) throw error;
            return data;
        },
    });

    // 2. Mutation to toggle Admin status
    const toggleAdminMutation = useMutation({
        mutationFn: async (newAdminStatus: boolean) => {
            const { error } = await supabase
                .from('profiles')
                .update({ user_type: newAdminStatus ? 'Admin' : 'Regular' })
                .eq('user_id', id as any);
            if (error) throw error;

        },
        onSuccess: (_, newStatus) => {
            // Refresh the data locally
            queryClient.invalidateQueries({ queryKey: ['admin_user_detail', id] });
            queryClient.invalidateQueries({ queryKey: ['admin_user_search'] });

            showToast({
                title: "Role updated",
                description: `User is now ${newStatus ? 'an Admin' : 'a Member'}.`,
            })

        },
    });

    const handleRoleToggle = () => {
        const action = profile?.user_type === 'Admin' ? 'Demote' : 'Promote';
        Alert.alert(
            `${action} User`,
            `Are you sure you want to ${action.toLowerCase()} ${profile?.email}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: () => toggleAdminMutation.mutate(profile?.user_type === 'Regular' ? true : false)
                },
            ]
        );
    };


    if (isLoading) {
        return (
            <Box className="flex-1 justify-center items-center bg-background-0">
                <Text>Loading profile...</Text>
            </Box>
        );
    }


    if (!profile) {
        return (
            <Center className="flex-1 justify-center items-center bg-background-0">
                <Text>Profile does not exist</Text>
            </Center>
        );
    }

    return (
        <Box className="flex-1 bg-background-0">


            <ScrollView showsVerticalScrollIndicator={false}>
                <VStack className="p-6 gap-8">
                    {/* User Header Card */}
                    <VStack className="items-center gap-4 bg-background-50 p-8 rounded-[40px] border border-outline-100">
                        <Box className="bg-primary-100 p-6 rounded-full">
                            <Icon as={UserIcon} size="xl" className="text-primary-600" />
                        </Box>
                        <VStack className="items-center gap-1">
                            <Heading size="xl" className="text-center">{profile?.full_name || 'Unnamed User'}</Heading>
                            <Text className="text-typography-500">{profile?.email}</Text>
                        </VStack>
                        <Badge action={profile?.user_type ? "info" : "muted"} variant="solid" className="rounded-full px-4">
                            <BadgeText className="font-bold">
                                {profile.user_type === 'Admin' ? 'ADMINISTRATOR' : (profile.user_type === 'Regular' ? 'MEMBER' : 'Super ADMINISTRATOR')}
                            </BadgeText>
                        </Badge>
                    </VStack>

                    {/* Information Section */}
                    <VStack className="gap-4">
                        <Heading size="md">Account Details</Heading>
                        <VStack className="bg-background-50 rounded-3xl border border-outline-50 overflow-hidden">
                            <HStack className="p-4 justify-between items-center">
                                <VStack>
                                    <Text size="xs" className="font-bold text-typography-400 uppercase">User UUID</Text>
                                    <Text size="sm" className="font-mono">{profile?.user_id}</Text>
                                </VStack>
                            </HStack>
                            <Divider />
                            <HStack className="p-4 justify-between items-center">
                                <VStack>
                                    <Text size="xs" className="font-bold text-typography-400 uppercase">Email Address</Text>
                                    <Text size="sm">{profile?.email}</Text>
                                </VStack>
                                <Icon as={Mail} size="sm" className="text-typography-300" />
                            </HStack>
                        </VStack>
                    </VStack>

                    {/* Permissions Section */}
                    <VStack className="gap-4 mb-10">
                        <Heading size="md">Administrative Actions</Heading>
                        <Box className="bg-background-50 p-6 rounded-3xl border border-outline-100 gap-4">
                            <VStack gap-2>
                                <Text size="sm" className="font-medium text-typography-700">
                                    Admin Access
                                </Text>
                                <Text size="xs" className="text-typography-500 leading-5">
                                    Admins can manage landmarks, view all user data, and update app content. Exercise caution when promoting users.
                                </Text>
                            </VStack>

                            {
                                profile.user_type === 'SuperAdmin' ? (
                                    <Button>
                                        <ButtonIcon as={ShieldCheck} className="mr-2" />
                                        <ButtonText className="font-bold">
                                            Super Admin
                                        </ButtonText>
                                    </Button>
                                ) : (
                                    <Button
                                        action={profile.user_type === 'Admin' ? "negative" : "primary"}
                                        variant="solid"
                                        className="rounded-2xl h-14"
                                        onPress={handleRoleToggle}
                                        isDisabled={toggleAdminMutation.isPending}
                                    >
                                        <ButtonIcon as={profile.user_type === 'Admin' ? ShieldOff : ShieldCheck} className="mr-2" />
                                        <ButtonText className="font-bold">
                                            {profile.user_type === 'Admin' ? 'Revoke Admin Status' : 'Grant Admin Status'}
                                        </ButtonText>
                                    </Button>
                                )
                            }
                        </Box>
                    </VStack>
                </VStack>
            </ScrollView>
        </Box>
    );
}