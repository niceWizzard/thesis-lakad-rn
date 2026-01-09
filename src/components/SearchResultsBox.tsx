import { Box } from '@/components/ui/box'
import { Divider } from '@/components/ui/divider'
import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { ChevronRight, MapPin } from 'lucide-react-native'
import React from 'react'
import { FlatList, Keyboard, TouchableOpacity, View } from 'react-native'
import { useLandmarkStore } from '../stores/useLandmarkStore'

const SearchResultsBox = ({
    searchString,
    onResultPress,
    visible
}: {
    searchString: string,
    onResultPress: (id: number) => void
    visible: boolean
}) => {
    // Hide if not visible, string too short, or only whitespace
    if (!visible || searchString.trim().length < 2) return null;

    const landmarks = useLandmarkStore(v => v.landmarks)
    const query = searchString.trim().toLowerCase();
    const results = landmarks.filter(v => v.name?.toLowerCase().includes(query));

    if (results.length === 0) return null;

    return (
        <VStack
            className='absolute top-[110px] left-4 right-4 bg-background-0 rounded-3xl shadow-soft-3 border border-outline-100 overflow-hidden z-40'
            style={{ maxHeight: 300 }}
        >
            <Box className="px-4 py-3 bg-background-50 border-b border-outline-50">
                <Text size="xs" className="font-bold text-typography-500 uppercase tracking-widest">
                    Found {results.length} Locations
                </Text>
            </Box>

            <FlatList
                data={results}
                keyExtractor={v => v.id.toString()}
                keyboardShouldPersistTaps='handled'
                showsVerticalScrollIndicator={true}
                ItemSeparatorComponent={() => <Divider className="bg-outline-50 mx-4" />}
                renderItem={({ item: landmark }) => (
                    <TouchableOpacity
                        className='flex-row items-center justify-between p-4 active:bg-background-50'
                        onPress={() => {
                            onResultPress(landmark.id)
                            Keyboard.dismiss()
                        }}
                    >
                        <View className="flex-row items-center flex-1 gap-3">
                            <Box className="bg-primary-50 p-2 rounded-full">
                                <Icon as={MapPin} size="sm" className="text-primary-600" />
                            </Box>
                            <VStack className="flex-1">
                                <Text size="md" className="font-medium text-typography-900" numberOfLines={1}>
                                    {landmark.name}
                                </Text>
                                <Text size="xs" className="text-typography-500">
                                    Historical Landmark
                                </Text>
                            </VStack>
                        </View>
                        <Icon as={ChevronRight} size="xs" className="text-typography-300" />
                    </TouchableOpacity>
                )}
            />
        </VStack>
    )
}

export default SearchResultsBox