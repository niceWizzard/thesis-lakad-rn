import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, RefreshCw, Route } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator } from 'react-native';

// UI Components
import { Box } from '@/components/ui/box';
import { Button, ButtonIcon, ButtonSpinner, ButtonText } from '@/components/ui/button';
import { Divider } from '@/components/ui/divider';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';

// Logic & Utils
import LoadingModal from '@/src/components/LoadingModal';
import { useToastNotification } from '@/src/hooks/useToastNotification';
import { calculateDistanceMatrix } from '@/src/utils/distance/calculateDistanceMatrix';
import { supabase } from '@/src/utils/supabase';

const ManageDistanceMatrix = () => {
    const queryClient = useQueryClient();
    const { showToast } = useToastNotification();
    const [status, setStatus] = useState<'idle' | 'fetching' | 'saving'>('idle')
    const [queryProgress, setQueryProgress] = useState(0)

    const { data: places, isLoading: loadingPlaces, error: placesError } = useQuery({
        queryKey: ['places'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('places')
                .select('*')
                .eq('is_verified', true)
                .is('deleted_at', null);

            if (error) throw error;
            if (!data) return [];
            return data;
        }
    })

    // Fetch existing stats from the distances table
    const { data: stats, isLoading: loadingStats, error: statsError } = useQuery({
        queryKey: ['distance-stats'],
        queryFn: async () => {
            const { count, error } = await supabase
                .from('distances')
                .select(`
                source,
                destination,
                source_ref:places!source!inner(deleted_at),
                dest_ref:places!destination!inner(deleted_at)
            `, { count: 'exact', head: true })
                .is('source_ref.deleted_at', null)
                .is('dest_ref.deleted_at', null);

            if (error) throw error;
            if (!count) return { totalRows: 0 };
            return { totalRows: count || 0 };
        },
    });

    const { mutate, isPending } = useMutation({
        mutationFn: async () => {
            setStatus('fetching');
            if (!places || places.length < 2) throw new Error("Need at least 2 landmarks.");

            const distanceMatrix = await calculateDistanceMatrix({
                waypointsWithIds: places.map(v => ({
                    coords: [v.longitude, v.latitude],
                    id: v.id.toString(),
                })),
                onFetchProgress(current, total) {
                    setQueryProgress(Math.round((current / total) * 100));
                },
            });

            const data = Object.keys(distanceMatrix).flatMap(source => {
                const value = distanceMatrix[source];
                return Object.keys(value)
                    .filter(v => v !== source)
                    .map(destination => ({
                        source: Number(source),
                        destination: Number(destination),
                        distance: value[destination],
                    }));
            });

            setStatus('saving')

            const { error } = await supabase.from("distances").upsert(data, {
                onConflict: "source, destination"
            });
            if (error) throw error;
        },
        onSettled() {
            setStatus('idle');
            setQueryProgress(0);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['distance-stats'] });
            showToast({ title: "Database updated successfully", action: "success" });
        },
        onError: (err: any) => {
            showToast({ title: "Update failed", description: err.message, action: "error" });
        }
    });

    const totalLandmarks = places?.length || 0;
    // Math: Total pairs in a matrix (excluding self-to-self) is n * (n - 1)
    const expectedPairs = totalLandmarks * (totalLandmarks - 1);

    if (loadingPlaces || loadingStats) {
        return (
            <Box className="flex-1 justify-center items-center bg-background-0">
                <ActivityIndicator size="large" color="#0891b2" />
            </Box>
        );
    }

    if (placesError || statsError) {
        return (
            <Box className="flex-1 justify-center items-center bg-background-0">
                <Text size="md" className="text-typography-500">Something went wrong</Text>
            </Box>
        )
    }

    const getLoadingText = () => {
        switch (status) {
            case 'fetching':
                return `Querying distances (${queryProgress}%)`
            case 'saving':
                return 'Saving distances...'
            case 'idle':
                return 'idle';
            default:
                return 'idle';
        }
    }

    return (
        <VStack className="flex-1 p-6 bg-background-0" space="xl">
            <LoadingModal
                isShown={isPending}
                loadingText={getLoadingText()}
            />
            <VStack space="xs">
                <Heading size="xl">Distance Engine</Heading>
                <Text size="sm" className="text-typography-500">
                    Manage the OSRM routing matrix for itinerary calculations.
                </Text>
            </VStack>

            {/* Statistics Cards */}
            <VStack space="md">
                <HStack space="md">
                    <Box className="flex-1 p-4 bg-background-50 rounded-3xl border border-outline-100">
                        <Icon as={MapPin} className="text-primary-600 mb-2" />
                        <Heading size="md">{totalLandmarks}</Heading>
                        <Text size="xs" className="text-typography-500 uppercase font-bold">Landmarks</Text>
                    </Box>
                    <Box className="flex-1 p-4 bg-background-50 rounded-3xl border border-outline-100">
                        <Icon as={Route} className="text-success-600 mb-2" />
                        <Heading size="md">{expectedPairs}</Heading>
                        <Text size="xs" className="text-typography-500 uppercase font-bold">Calc. Pairs</Text>
                    </Box>
                </HStack>

                <Box className="p-4 bg-background-50 rounded-3xl border border-outline-100">
                    <HStack >
                        <VStack>
                            <Heading size="sm" className="text-typography-900">Database Status</Heading>
                            <Text size="xs" className="text-typography-500">Currently stored distance records</Text>
                        </VStack>
                        <HStack space="xs" >
                            <Text size="lg" className="font-bold text-primary-700">{stats?.totalRows}</Text>
                            <Text size="xs" className="text-typography-400">rows</Text>
                        </HStack>
                    </HStack>
                </Box>
            </VStack>

            <Divider className="my-2" />

            <Box className="mt-auto">
                <VStack space="md" className="bg-info-50 p-4 rounded-2xl border border-info-100 mb-4">
                    <HStack space="xs" >
                        <Icon as={RefreshCw} size="xs" className="text-info-600" />
                        <Text size="xs" className="text-info-700 font-bold uppercase">Important</Text>
                    </HStack>
                    <Text size="xs" className="text-info-600 leading-5">
                        Updating the database will re-calculate every possible path between all landmarks.
                        This may take a few moments depending on the number of waypoints.
                    </Text>
                </VStack>

                <Button
                    size="lg"
                    className="rounded-2xl h-14 bg-primary-600"
                    onPress={() => mutate()}
                    isDisabled={isPending || totalLandmarks < 2}
                >
                    {isPending ? <ButtonSpinner className="mr-2" /> : <ButtonIcon as={RefreshCw} className="mr-2" />}
                    <ButtonText className="font-bold">
                        {isPending ? "Calculating Distances ..." : "Update Distance Database"}
                    </ButtonText>
                </Button>
            </Box>
        </VStack>
    );
};

export default ManageDistanceMatrix;