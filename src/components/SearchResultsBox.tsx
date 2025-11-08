import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { FlatList, Keyboard, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native'
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
    const colorScheme = useColorScheme();

    if (!visible || !searchString.trim()) {
        return null;
    }

    const test = new RegExp(searchString.trim(), 'i')
    const results = historicalLandmarks.filter(v => test.test(v.name));

    return (
        <View style={[
            styles.container,
            {
                backgroundColor: colorScheme === 'dark' ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.95)',
                borderColor: colorScheme === 'dark' ? '#333' : '#ddd',
            }
        ]}>
            <Text style={[
                styles.resultsTitle,
                { color: colorScheme === 'dark' ? '#ccc' : '#666' }
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
                        <Ionicons
                            name="location-outline"
                            size={16}
                            color={colorScheme === 'dark' ? '#999' : '#666'}
                        />
                        <Text style={[
                            styles.resultText,
                            { color: colorScheme === 'dark' ? 'white' : 'black' }
                        ]}>
                            {landmark.name}
                        </Text>
                    </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
                style={styles.list}
            />
        </View>
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