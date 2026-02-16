import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { useRouter } from "expo-router";
import React from 'react';
import { Image, Platform, ScrollView, StatusBar, TouchableOpacity, View } from "react-native";

import { Box } from '@/components/ui/box';
import { Icon } from '@/components/ui/icon';
import { StorageKey } from '@/src/constants/Key';
import { useToastNotification } from '@/src/hooks/useToastNotification';
import { useAuthStore } from '@/src/stores/useAuth';
import { mmkvStorage } from '@/src/utils/mmkv';
import { supabase } from '@/src/utils/supabase';
import { useIsFocused } from '@react-navigation/native';
import {
    ArchiveRestore,
    ChevronRight,
    Info,
    Key,
    LogOut,
    Mail,
    MapPin,
    Settings,
    Sliders,
    UserCheck2
} from 'lucide-react-native';
import { CopilotProvider, CopilotStep, useCopilot, walkthroughable } from 'react-native-copilot';

const CopilotBox = walkthroughable(Box);


const coverImage = require('@/assets/images/lakad-cover.png');

function MoreTabContent() {
    const router = useRouter();
    const { session, isAdmin } = useAuthStore();
    const { showToast } = useToastNotification();
    const { start, currentStep, stop } = useCopilot();
    const isFocused = useIsFocused();

    React.useEffect(() => {
        const hasShown = mmkvStorage.getBoolean(StorageKey.MoreTutorialShown);
        if (!hasShown) {
            // Small delay to ensure layout is ready
            setTimeout(() => {
                if (!isFocused) return;
                start();
                mmkvStorage.set(StorageKey.MoreTutorialShown, true);
            }, 50);
        }
        return () => {
            if (currentStep && !isFocused) {
                stop();
            }
        }
    }, [start, isFocused, currentStep, stop]);


    const handleSignoutPress = async () => {
        try {
            const { error } = await supabase.auth.signOut();

            if (error) {
                // Handle the error directly here instead of throwing
                showToast({
                    title: "Signout Error",
                    description: error.message,
                    action: 'error',
                });
                return;
            }

            router.replace('/(auth)/signin');
        } catch (e) {
            showToast({
                title: "Signout Error",
                description: (e as Error).message,
                action: 'error',
            });
        }
    };


    return (
        <ScrollView
            className="flex-1 bg-background-0"
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
        >
            {/* 1. Profile Header Section */}
            <CopilotStep
                text="Here is your profile information. You can tap 'How to use...' anytime to restart this tour."
                order={1}
                name="profileHeader"
            >
                <CopilotBox className="items-center pt-10 pb-4 mb-6 px-6 bg-background-50 border-b border-outline-50" collapsable={false}>
                    <View className="relative p-4 rounded-full border-4 border-background-0 shadow-soft-1 bg-background-0">
                        <Image
                            source={coverImage}
                            className="w-24 h-24"
                            resizeMode="cover"
                        />
                    </View>

                    <Heading size="xl" className="mt-4 text-typography-900">Lakad</Heading>



                    {session?.user?.email && (
                        <View className="flex-row items-center mt-1 gap-4">
                            <Icon as={Mail} size="md" className="text-typography-400" />
                            <Text size="sm" className="text-typography-500">{session.user.email}</Text>
                        </View>
                    )}
                    <TouchableOpacity onPress={() => start()}
                        className='self-start mt-4 flex-row items-center gap-2'
                    >
                        <Icon as={Info} size="md" className="text-primary-700" />

                        <Text size="xs" className="text-primary-700 font-bold">
                            How to use this page?
                        </Text>

                    </TouchableOpacity>
                </CopilotBox>
            </CopilotStep>

            {/* 2. Menu Section */}
            <View className="px-4 mt-6">
                <Text size="xs" className="uppercase font-bold text-typography-400 ml-4 mb-2 tracking-widest">
                    General
                </Text>

                <Box
                    className="bg-background-50 rounded-3xl border border-outline-200 shadow-sm"
                >
                    <CopilotStep
                        text="Manage your account details and profile settings."
                        order={2}
                        name="accountSettings"
                    >
                        <CopilotBox collapsable={false}>
                            <TouchableOpacity
                                onPress={() => router.navigate('/profile/settings')}
                                className="flex-row items-center justify-between p-5 active:bg-background-100"
                            >
                                <View className="flex-row items-center gap-4">
                                    <View className="bg-background-100 p-2 rounded-xl">
                                        <Icon as={Settings} size='lg' />
                                    </View>
                                    <Text size="md" className="font-medium text-typography-800">
                                        Account Settings
                                    </Text>
                                </View>
                                <Icon as={ChevronRight} />
                            </TouchableOpacity>
                        </CopilotBox>
                    </CopilotStep>

                    <CopilotStep
                        text="View and restore your deleted trips."
                        order={3}
                        name="archivedItineraries"
                    >
                        <CopilotBox collapsable={false}>
                            <TouchableOpacity
                                onPress={() => router.navigate('/archived-itineraries')}
                                className="flex-row items-center justify-between p-5 active:bg-background-100"
                            >
                                <View className="flex-row items-center gap-4">
                                    <View className="bg-background-100 p-2 rounded-xl">
                                        <Icon as={ArchiveRestore} size='lg' />
                                    </View>
                                    <Text size="md" className="font-medium text-typography-800">
                                        Archived Itineraries
                                    </Text>
                                </View>
                                <Icon as={ChevronRight} />
                            </TouchableOpacity>
                        </CopilotBox>
                    </CopilotStep>

                    <CopilotStep
                        text="Set your travel preferences to get personalized recommendations."
                        order={4}
                        name="travelPreferences"
                    >
                        <CopilotBox collapsable={false}>
                            <TouchableOpacity
                                onPress={() => router.navigate('/(onboarding)/preferences')}
                                className="flex-row items-center justify-between p-5 active:bg-background-100"
                            >
                                <View className="flex-row items-center gap-4">
                                    <View className="bg-background-100 p-2 rounded-xl">
                                        <Icon as={Sliders} size='lg' />
                                    </View>
                                    <Text size="md" className="font-medium text-typography-800">
                                        Travel Preferences
                                    </Text>
                                </View>
                                <Icon as={ChevronRight} />
                            </TouchableOpacity>
                        </CopilotBox>
                    </CopilotStep>

                    <CopilotStep
                        text="Update your password securely."
                        order={5}
                        name="changePassword"
                    >
                        <CopilotBox collapsable={false}>
                            <TouchableOpacity
                                onPress={() => router.navigate('/change-password')}
                                className="flex-row items-center justify-between p-5 active:bg-background-100"
                            >
                                <View className="flex-row items-center gap-4">
                                    <View className="bg-background-100 p-2 rounded-xl">
                                        <Icon as={Key} size='lg' />
                                    </View>
                                    <Text size="md" className="font-medium text-typography-800">
                                        Change Password
                                    </Text>
                                </View>
                                <Icon as={ChevronRight} />
                            </TouchableOpacity>
                        </CopilotBox>
                    </CopilotStep>

                    {isAdmin && (
                        <>
                            <CopilotStep
                                text="Access administrative tools."
                                order={6}
                                name="adminMode"
                            >
                                <CopilotBox collapsable={false}>
                                    <TouchableOpacity
                                        onPress={() => router.replace("/(admin)/(tabs)/more")}
                                        className="flex-row items-center justify-between p-5 active:bg-background-100"
                                    >
                                        <View className="flex-row items-center gap-4">
                                            <View className="bg-background-100 p-2 rounded-xl">
                                                <Icon as={UserCheck2} size='lg' />
                                            </View>
                                            <Text size="md" className="font-medium text-typography-800">
                                                Admin Mode
                                            </Text>
                                        </View>
                                        <Icon as={ChevronRight} />
                                    </TouchableOpacity>
                                </CopilotBox>
                            </CopilotStep>
                        </>
                    )}

                    <CopilotStep
                        text="Explore all landmarks."
                        order={7}
                        name="allLandmarks"
                    >
                        <CopilotBox collapsable={false}>
                            <TouchableOpacity
                                onPress={() => router.push('/landmark/all')}
                                className="flex-row items-center justify-between p-5 active:bg-background-100"
                            >
                                <View className="flex-row items-center gap-4">
                                    <View className="bg-background-100 p-2 rounded-xl">
                                        <Icon as={MapPin} size='lg' />
                                    </View>
                                    <Text size="md" className="font-medium text-typography-800">
                                        View All Landmarks
                                    </Text>
                                </View>
                                <Icon as={ChevronRight} />
                            </TouchableOpacity>
                        </CopilotBox>
                    </CopilotStep>

                    <CopilotStep
                        text="View application information."
                        order={8}
                        name="aboutLakad"
                    >
                        <CopilotBox collapsable={false}>
                            <TouchableOpacity
                                onPress={() => router.push('/about')}
                                className="flex-row items-center justify-between p-5 active:bg-background-100"
                            >
                                <View className="flex-row items-center gap-4">
                                    <View className="bg-background-100 p-2 rounded-xl">
                                        <Icon as={Info} size='lg' />
                                    </View>
                                    <Text size="md" className="font-medium text-typography-800">
                                        About Lakad
                                    </Text>
                                </View>
                                <Icon as={ChevronRight} />
                            </TouchableOpacity>
                        </CopilotBox>
                    </CopilotStep>
                </Box>
            </View>

            {/* 3. Danger Zone / Footer */}

            <View className="px-4 mt-8">
                <CopilotStep
                    text="Tap here to sign out of your account."
                    order={9}
                    name="signOutButton"
                >
                    <CopilotBox collapsable={false}>
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
                    </CopilotBox>
                </CopilotStep>

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

function MoreTab() {
    return (
        <CopilotProvider
            verticalOffset={Platform.OS === 'android' ? StatusBar.currentHeight : 0}
        >
            <MoreTabContent />
        </CopilotProvider>
    );
}

export default MoreTab;