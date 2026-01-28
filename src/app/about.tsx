import { Box } from '@/components/ui/box';
import { Divider } from '@/components/ui/divider';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { Stack } from 'expo-router';
import React from 'react';
import { ScrollView } from 'react-native';

export default function AboutScreen() {
    return (
        <React.Fragment>
            <Stack.Screen options={{
                headerShown: true,
                headerTitle: "About",
                headerBackTitle: "Back",
            }} />
            <ScrollView
                className="flex-1 bg-background-0"
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
            >
                <VStack className="p-6 gap-6">
                    {/* Header Section */}
                    <Box className="items-center mt-4 mb-4">
                        <Heading size="2xl" className="text-primary-600 tracking-tight">LAKAD</Heading>
                        <Text size="sm" className="text-typography-500 font-medium tracking-widest uppercase mt-1">
                            Thesis Project
                        </Text>
                    </Box>

                    {/* Thesis Concept */}
                    <Box className="bg-background-50 p-6 rounded-3xl border border-outline-100 shadow-soft-1">
                        <Heading size="md" className="mb-3 text-typography-900">Concept</Heading>
                        <Text className="text-typography-600 leading-6">
                            This application implements the Traveling Salesman Problem (TSP) algorithm to optimize routes and generate efficient travel itineraries.
                            It aims to help travelers maximize their time by suggesting the best possible path to visit multiple destinations.
                        </Text>
                    </Box>

                    <Divider className="my-2 bg-outline-50" />

                    {/* Creators Section */}
                    <Box>
                        <Heading size="md" className="mb-4 text-typography-900 px-2">The Team</Heading>
                        <VStack className="gap-3">
                            <CreatorCard name="Richard Manansala" role="Developer" />
                            <CreatorCard name="Brian Gabrial Magbanua" role="Developer" />
                            <CreatorCard name="Franniel Luigi Hilario" role="Developer" />
                            <CreatorCard name="Bryan Declaro" role="Developer" />
                        </VStack>
                    </Box>


                    <Divider className="my-2 bg-outline-50" />

                    {/* Advisers Section */}
                    <Box>
                        <Heading size="md" className="mb-4 text-typography-900 px-2">Advisers</Heading>
                        <VStack className="gap-3">
                            <CreatorCard name="Aarhus Dela Cruz" role="Adviser" />
                            <CreatorCard name="Aaron Paul Dela Rosa" role="Adviser" />
                        </VStack>
                    </Box>

                    <Divider className="my-2 bg-outline-50" />

                    {/* Academic Info */}
                    <Box className="items-center py-6">
                        <Text size="sm" className="font-bold text-typography-800 text-center uppercase tracking-widest">
                            Bulacan State University
                        </Text>
                        <Text size="xs" className="text-typography-500 text-center mt-1">
                            College of Science
                        </Text>
                        <Text size="xs" className="text-typography-500 text-center">
                            BS Math major in Computer Science
                        </Text>
                        <Text size="xs" className="text-typography-400 text-center mt-4">
                            4th Year Students • Batch 2026
                        </Text>
                    </Box>
                </VStack>
            </ScrollView>
        </React.Fragment>
    );
}

function CreatorCard({ name, role }: { name: string, role: string }) {
    return (
        <Box className="bg-background-50 p-4 rounded-2xl border border-outline-50 flex-row justify-between items-center">
            <Text className="font-medium text-typography-800">{name}</Text>
            {/* <Text size="xs" className="text-primary-600 font-bold uppercase tracking-wider">{role}</Text> */}
        </Box>
    );
}
