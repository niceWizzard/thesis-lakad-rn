import { Button, ButtonText } from '@/components/ui/button'
import { VStack } from '@/components/ui/vstack'
import { useQueryLandmarks } from '@/src/hooks/useQueryLandmarks'
import { calculateDistanceMatrix } from '@/src/utils/distance/calculateDistanceMatrix'
import { supabase } from '@/src/utils/supabase'
import { useMutation } from '@tanstack/react-query'
import React from 'react'

const ManageDistanceMatrix = () => {

    const {
        landmarks,
        isLoading,
        error,
    } = useQueryLandmarks()


    const { mutate, isPending } = useMutation({
        mutationFn: async () => {
            const distanceMatrix = await calculateDistanceMatrix({
                waypointsWithIds: landmarks.map(v => ({
                    coords: [v.longitude, v.latitude],
                    id: v.id.toString(),
                })),
            })
            const data = Object.keys(distanceMatrix).flatMap(source => {
                const value = distanceMatrix[source];
                return Object.keys(value).filter(v => v !== source).map(destination => ({
                    source: Number(source),
                    destination: Number(destination),
                    distance: value[destination],
                }))
            })
            await supabase.from("distances").upsert(data, { onConflict: "source, destination" })
        }
    })

    if (isLoading) {
        return <VStack className='flex-1 justify-center p-4'>
            <Button>
                <ButtonText>Loading...</ButtonText>
            </Button>
        </VStack>
    }

    if (error) {
        return <VStack className='flex-1 justify-center p-4'>
            <Button>
                <ButtonText>Error: {JSON.stringify(error)}</ButtonText>
            </Button>
        </VStack>
    }

    return (
        <VStack className='flex-1 justify-center p-4'>
            <Button
                onPress={() => mutate()}
                isDisabled={isPending}
            >
                <ButtonText>
                    {isPending ? "Updating..." : "Update Distance Matrix"}
                </ButtonText>
            </Button>
        </VStack>
    )
}

export default ManageDistanceMatrix