import React from 'react'
import { FlatList, Pressable } from 'react-native'
import { historicalLandmarks } from '../constants/Landmarks'
import { Text, View } from './Themed'

const SearchResultsBox = ({searchString, onResultPress} : {searchString: string, onResultPress: (id: number) => void}) => {


    if(!searchString.trim()) {
        return
    }
    const test = new RegExp(searchString.trim(), 'i')
    return (
        <View style={{
            position: "absolute",
            top: 72,
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center',
            left: 16,
            right: 16,
            padding: 16,
        }}>
            <FlatList 
                data={historicalLandmarks.filter(v => test.test(v.name))}
                keyExtractor={v => v.id.toString()}
                renderItem={({item: landmark}) => (
                    <Pressable style={{padding: 8}}
                        onPress={() => onResultPress(landmark.id)}
                    >
                        <Text>
                            {landmark.name}
                        </Text>
                    </Pressable>
                )}
            
            />
        </View>
    )
}

export default SearchResultsBox