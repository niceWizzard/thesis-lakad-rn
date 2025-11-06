import { Ionicons } from '@expo/vector-icons'
import React, { useState } from 'react'
import { StyleSheet, TextInput, useColorScheme } from 'react-native'
import { View } from './Themed'

const ExploreSearchBox = ({
  onSearch,
} : {
  onSearch: (s : string) => void
}) => {
  const [value, setValue] = useState('')
  const colorScheme = useColorScheme()
  return (
    <View style={styles.container}>
      <TextInput 
        placeholder='Search for places...'
        placeholderTextColor={colorScheme == 'dark' ? 'white' : 'black'}
        
        value={value}
        style={[
          styles.input,
          {
            color: colorScheme == 'dark' ? 'white' : 'black',
          }
        ]}
        onChangeText={(v) => {
          setValue(v)
          onSearch(v)
        }}
      />
      <Ionicons 
        name='search'
        size={20}
        color="#666"
        style={styles.icon}
      />
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        top: 24,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
    },
    input: {
        flex: 1,
        padding: 0, // Remove default padding if needed
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    icon: {
        // No flex, just takes its natural size
        paddingHorizontal: 12,
        paddingVertical: 12,
    }
})

export default ExploreSearchBox