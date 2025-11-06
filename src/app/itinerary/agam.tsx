import FilterAccordion from '@/src/components/FilterAccordion'
import { Text, View } from '@/src/components/Themed'
import { historicalLandmarks } from '@/src/constants/Landmarks'
import { useItineraryStore } from '@/src/stores/useItineraryStore'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
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

  // District data
  const districtItems = [
    { id: 'district1', label: 'District 1' },
    { id: 'district2', label: 'District 2' },
    { id: 'district3', label: 'District 3' },
    { id: 'district4', label: 'District 4' },
    { id: 'district5', label: 'District 5' },
    { id: 'district6', label: 'District 6' },
    { id: 'lone', label: 'Lone District' },
  ]

  // Category data (example - add more filters as needed)
  const categoryItems = [
    { id: 'museum', label: 'Museum' },
    { id: 'nature', label: 'Nature & Parks' },
    { id: 'culture', label: 'Cultural Sites' },
  ]

  function shuffle<T>(arr: T[]) {
    return [...arr].sort(() => Math.random() - 0.5);
  }

const CreateWithAgamScreen = () => {
  const mode = useColorScheme()

  const [maxDistance, setMaxDistance] = useState('')
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>(
    districtItems.map(v => v.id)
  )
  const [selectedCategories, setSelectedCategories] = useState<string[]>(categoryItems.map(v => v.id))

  const addItinerary = useItineraryStore(v => v.addItinerary)
  const router = useRouter()

  function onGenerateClick() {
    if(maxDistance.trim() !== '' && Number.isNaN(Number.parseFloat(maxDistance))) {
      alert("Invalid max distance!")
      return;
    }
    if(selectedDistricts.length == 0 || selectedCategories.length == 0) {
        alert("Cannot have empty categories or districts!")
        return
    }

    const id = Date.now().toString()
    // Add your generation logic here
    addItinerary({
      id: id,
      name: "Agam "+ Date.now(),
      poiOrder: shuffle(historicalLandmarks).map(v => ({
        ...v,
        visited: false,
      })),
    })
    router.replace({
      pathname: '/itinerary/[id]',
      params: {
        id,
      }
    })
  }

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
            showsVerticalScrollIndicator={false}
          >
            {/* District Filter */}
            <FilterAccordion 
              title="Filter by District"
              items={districtItems}
              selectedItems={selectedDistricts}
              onSelectionChange={setSelectedDistricts}
              multiple={true}
            />

            {/* Category Filter */}
            <FilterAccordion 
              title="Filter by Category"
              items={categoryItems}
              selectedItems={selectedCategories}
              onSelectionChange={setSelectedCategories}
              multiple={true}
            />

            {/* Max Distance Input */}
            <View style={{ marginVertical: 16 }}>
              <Text style={{
                fontSize: 18, 
                fontWeight: '600',
                color: mode === 'dark' ? 'white' : 'black',
                marginBottom: 8
              }}>
                Maximum Travel Distance
              </Text>
              
              <TextInput 
                placeholder='0km'
                placeholderTextColor={mode === 'dark' ? '#999' : '#666'}
                value={maxDistance}
                onChangeText={setMaxDistance}
                style={{
                  borderWidth: 1,
                  borderColor: mode === 'dark' ? '#444' : '#ddd',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  color: mode === 'dark' ? 'white' : 'black',
                  backgroundColor: mode === 'dark' ? '#1a1a1a' : 'white',
                }}
                keyboardType='numeric'
              />
              
              <Text style={{
                color: mode === 'dark' ? '#999' : '#666',
                fontSize: 14,
                marginTop: 4
              }}>
                Input distance to which the itinerary distance cannot exceed.
              </Text>
            </View>

            {/* Selected Filters Summary */}
            {(selectedDistricts.length > 0 || selectedCategories.length > 0) && (
              <View style={{
                backgroundColor: mode === 'dark' ? '#2a2a2a' : '#f0f0f0',
                padding: 12,
                borderRadius: 8,
                marginVertical: 8
              }}>
                <Text style={{
                  fontWeight: '600',
                  color: mode === 'dark' ? 'white' : 'black',
                  marginBottom: 4
                }}>
                  Selected Filters:
                </Text>
                {selectedDistricts.length > 0 && (
                  <Text style={{color: mode === 'dark' ? '#ccc' : '#666'}}>
                    Districts: {selectedDistricts.length} / {districtItems.length}
                  </Text>
                )}
                {selectedCategories.length > 0 && (
                  <Text style={{color: mode === 'dark' ? '#ccc' : '#666'}}>
                    Categories: {selectedCategories.length} / {categoryItems.length}
                  </Text>
                )}
              </View>
            )}
          </ScrollView>

          {/* Fixed button at bottom */}
          <View style={{
            padding: 8,
            backgroundColor: 'transparent'
          }}>
            <Pressable 
              onPress={onGenerateClick}
              style={{
                backgroundColor: mode === 'dark' ? 'white' : 'black',
                padding: 16,
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <Text style={{
                color: mode === 'dark' ? 'black' : 'white',
                fontWeight: 'bold',
                fontSize: 16
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