import { Box } from '@/components/ui/box'
import { Divider } from '@/components/ui/divider'
import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { addRecentSearch, getRecentSearches } from '@/src/utils/searchHistory'
import { ChevronRight, Clock, MapPin } from 'lucide-react-native'
import React, { useEffect, useState } from 'react'
import { FlatList, Keyboard, TouchableOpacity, View } from 'react-native'
import { useQueryLandmarks } from '../hooks/useQueryLandmarks'
import { Landmark } from '../model/landmark.types'

const SearchResultsBox = ({
    searchString,
    onResultPress,
    visible
}: {
    searchString: string,
    onResultPress: (id: number) => void
    visible: boolean
}) => {

    const { landmarks } = useQueryLandmarks();
    const [recentLandmarks, setRecentLandmarks] = useState<Landmark[]>([])

    // Load recent searches when visible becomes true
    useEffect(() => {
        if (visible) {
            const ids = getRecentSearches();
            const recent = ids
                .map(id => landmarks.find(l => l.id === id))
                .filter((l): l is Landmark => !!l);
            setRecentLandmarks(recent);
        }
    }, [visible, landmarks]);

    const query = searchString.trim().toLowerCase();
    const isSearching = query.length > 0;

    let results: Landmark[] = [];
    let title = "";

    if (isSearching) {
        results = landmarks.filter(v => v.name?.toLowerCase().includes(query));
        title = `Found ${results.length} Locations`;
    } else {
        results = recentLandmarks;
        title = "Recent Searches";
    }

    // Hide if not visible
    if (!visible) return null;

    // Hide if searching but query too short (opt: 1 char is enough for reactive search)
    // if (isSearching && query.length < 1) return null;

    // Hide if no results and searching
    if (isSearching && results.length === 0) return null;

    // Hide if no recent searches and not searching
    if (!isSearching && results.length === 0) return null;


    return (
        <VStack
            className='absolute top-[110px] left-4 right-4 bg-background-0 rounded-3xl shadow-soft-3 border border-outline-100 overflow-hidden z-40'
            style={{ maxHeight: 300 }}
        >
            <Box className="px-4 py-3 bg-background-50 border-b border-outline-50">
                <Text size="xs" className="font-bold text-typography-500 uppercase tracking-widest">
                    {title}
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
                            addRecentSearch(landmark.id);
                            onResultPress(landmark.id);
                            Keyboard.dismiss();
                        }}
                    >
                        <View className="flex-row items-center flex-1 gap-3">
                            <Box className={`p-2 rounded-full ${isSearching ? 'bg-primary-50' : 'bg-background-100'}`}>
                                <Icon
                                    as={isSearching ? MapPin : Clock}
                                    size="sm"
                                    className={isSearching ? "text-primary-600" : "text-typography-400"}
                                />
                            </Box>
                            <VStack className="flex-1">
                                <Text size="md" className="font-medium text-typography-900" numberOfLines={1}>
                                    {landmark.name}
                                </Text>
                                <Text size="xs" className="text-typography-500">
                                    {isSearching ? landmark.type : 'Recently viewed'}
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