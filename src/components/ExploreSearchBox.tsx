import React from 'react'
import { StyleSheet } from 'react-native'
import { Text, View } from './Themed'

const ExploreSearchBox = () => {
  return (
    <View style={styles.container}>
      <Text>ExploreSearchBox</Text>
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
        width: "80%",
        position: "absolute",
        top: 24,
        left: "50%",
        transform: "translate(-50%)",
        padding: 12,

    },

})

export default ExploreSearchBox