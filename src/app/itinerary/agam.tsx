import { Text, View } from '@/src/components/Themed'
import React from 'react'
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    TextInput,
    TouchableWithoutFeedback,
    useColorScheme
} from 'react-native'

const CreateWithAgamScreen = () => {
  const mode = useColorScheme()

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{flex: 1}}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{flex: 1, padding: 8}}>
          <ScrollView 
            contentContainerStyle={{flexGrow: 1}}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={{fontSize: 18}}>
                Maximum Travel Distance
            </Text>
            <TextInput 
            placeholder='0km'
            style={{
                borderWidth: 1,
                borderColor: mode === 'dark' ? 'white' : 'black',
                borderRadius: 8,
                marginVertical: 8
            }}
            />
            <Text>Input distance to which the itinerary distance cannot exceed.</Text>
          </ScrollView>

          {/* Fixed button at bottom */}
          <View style={{
            padding: 8,
            backgroundColor: 'transparent'
          }}>
            <Pressable 
              style={{
                backgroundColor: mode === 'dark' ? 'white' : 'black',
                padding: 16,
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <Text style={{
                color: mode === 'dark' ? 'black' : 'white',
                fontWeight: 'bold'
              }}>
                Generate
              </Text>
            </Pressable>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  )
}

export default CreateWithAgamScreen