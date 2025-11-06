import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { StyleSheet, TextInput } from 'react-native'
import { View } from './Themed'

const ExploreSearchBox = () => {
  return (
    <View style={styles.container}>
      <TextInput 
        placeholder='Search for places...'
        style={styles.input}
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
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
    },
    input: {
        flex: 1,
        padding: 0, // Remove default padding if needed
    },
    icon: {
        // No flex, just takes its natural size
    }
})

export default ExploreSearchBox