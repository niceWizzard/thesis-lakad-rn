import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { MapPin } from 'lucide-react-native'
import React from 'react'
import { FlatList, Keyboard, StyleSheet, TouchableOpacity } from 'react-native'
import { historicalLandmarks } from '../constants/Landmarks'

const SearchResultsBox = ({
    searchString,
    onResultPress,
    visible
}: {
    searchString: string,
    onResultPress: (id: number) => void
    visible: boolean
}) => {
    if (!visible || !searchString.trim()) {
        return null;
    }

    const test = new RegExp(searchString.trim(), 'i')
    const results = historicalLandmarks.filter(v => test.test(v.name));

    return (
        <VStack
            className='absolute top-24 bg-background-0 left-4 right-4 rounded-md p-4'
        >
            <Text style={[
                styles.resultsTitle,
            ]}>
                Search Results ({results.length})
            </Text>
            <FlatList
                data={results}
                keyExtractor={v => v.id.toString()}
                keyboardShouldPersistTaps={'always'}
                renderItem={({ item: landmark }) => (
                    <TouchableOpacity
                        style={[
                            styles.resultItem,
                        ]}
                        onPress={() => {
                            onResultPress(landmark.id)
                            Keyboard.dismiss()
                        }}
                    >
                        <Icon as={MapPin} />
                        <Text style={[
                            styles.resultText,
                        ]}>
                            {landmark.name}
                        </Text>
                    </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
                style={styles.list}
            />
        </VStack>
    )
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        top: 90,
        borderRadius: 12,
        left: 16,
        right: 16,
        maxHeight: 200,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
        padding: 12,
    },
    resultsTitle: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    list: {
        flex: 1,
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        gap: 12,
        borderRadius: 8,
    },
    resultItemPressed: {
        backgroundColor: 'rgba(0,0,0,0.05)',
        transform: [{ scale: 0.95 }]
    },
    resultText: {
        fontSize: 14,
        flex: 1,
    },
})

export default SearchResultsBox