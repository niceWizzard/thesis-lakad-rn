import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Divider } from '@/components/ui/divider';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { useRouter } from "expo-router";
import React from 'react';
import { Alert, ScrollView, TouchableOpacity, View } from "react-native";

import { Icon } from '@/components/ui/icon';
import { Toast, ToastDescription, ToastTitle, useToast } from '@/components/ui/toast';
import { useAuthStore } from '@/src/stores/useAuth';
import { supabase } from '@/src/utils/supabase';
import {
    ArrowLeftRight,
    ChevronRight,
    Key,
    LogOut,
    Mail,
    Settings
} from 'lucide-react-native';

const coverImage = require('@/assets/images/lakad-cover.png');

function MoreTab() {
    const router = useRouter();
    const { session } = useAuthStore();
    const toast = useToast();

    const menuItems = [
        {
            id: '1',
            title: 'Make an Admin',
            icon: Settings,
            onPress: () => Alert.alert('Settings', 'Settings screen coming soon!'),
        },
        {
            id: '3',
            title: 'Change Password',
            icon: Key,
            onPress: () => router.navigate('/change-password'),
        }
    ] as const;

    const handleSignoutPress = async () => {
        try {
            const { error } = await supabase.auth.signOut();

            if (error) {
                // Handle the error directly here instead of throwing
                showErrorToast(error.message);
                return;
            }

            router.replace('/(auth)/signin');
        } catch (e) {
            showErrorToast((e as Error).message);
        }
    };

    const handleBackToRegularModePress = () => {
        router.replace("/");
    }


    // Abstract this to keep handleSignoutPress clean
    const showErrorToast = (message: string) => {
        toast.show({
            placement: "bottom",
            render: ({ id }) => {
                return (
                    // Ensure Toast has a unique key
                    <Toast nativeID={"toast-" + id} action="error" variant="solid">
                        <ToastTitle>Sign Out Failed</ToastTitle>
                        <ToastDescription>{message}</ToastDescription>
                    </Toast>
                );
            }
        });
    };

    return (
        <ScrollView
            className="flex-1 bg-background-0"
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
        >
            {/* 1. Profile Header Section */}
            <View className="items-center py-10 px-6 bg-background-50 border-b border-outline-50">
                <Heading size="xl" className="mt-4 text-typography-900">Admin</Heading>

                {session?.user?.email && (
                    <View className="flex-row items-center mt-1 gap-4">
                        <Icon as={Mail} size="md" className="text-typography-400" />
                        <Text size="sm" className="text-typography-500">{session.user.email}</Text>
                    </View>
                )}
            </View>

            {/* 2. Menu Section */}
            <View className="px-4 mt-6">
                <Text size="xs" className="uppercase font-bold text-typography-400 ml-4 mb-2 tracking-widest">
                    General
                </Text>
                <View className="bg-background-50 rounded-3xl border border-outline-100 overflow-hidden shadow-soft-1">
                    {menuItems.map((item, index) => (
                        <View key={item.id}>
                            <TouchableOpacity
                                onPress={item.onPress}
                                className="flex-row items-center justify-between p-5 active:bg-background-100"
                            >
                                <View className="flex-row items-center gap-4">
                                    <View className="bg-background-100 p-2 rounded-xl">
                                        <Icon as={item.icon} size='lg' className="text-typography-700" />
                                    </View>
                                    <Text size="md" className="font-medium text-typography-800">
                                        {item.title}
                                    </Text>
                                </View>
                                <Icon as={ChevronRight} className='' />
                            </TouchableOpacity>
                            {index < menuItems.length - 1 && (
                                <View className="px-5">
                                    <Divider className="bg-outline-50" />
                                </View>
                            )}
                        </View>
                    ))}
                </View>
            </View>

            {/* 3. Danger Zone / Footer */}
            <View className="px-4 mt-8 gap-2" >
                <Button
                    action="negative"
                    variant="solid"
                    size="lg"
                    className="rounded-2xl  h-14"
                    onPress={handleSignoutPress}
                >
                    <ButtonText className="font-bold">Sign Out</ButtonText>
                    <ButtonIcon as={LogOut} size="md" className="ml-2" />
                </Button>
                <Button
                    action="secondary"
                    variant="solid"
                    size="lg"
                    className="rounded-2xl  h-14"
                    onPress={handleBackToRegularModePress}
                >
                    <ButtonText className="font-bold">Back to Regular Mode</ButtonText>
                    <ButtonIcon as={ArrowLeftRight} size="md" className="ml-2" />
                </Button>

                <View className="items-center mt-8">
                    <Text size="xs" className="text-typography-400 font-medium">
                        LAKAD APP • VERSION 1.0.0
                    </Text>
                    <Text size="xs" className="text-typography-300 mt-1 italic">
                        Made for smart travelers
                    </Text>
                </View>
            </View>
        </ScrollView>
    );
}

export default MoreTab;