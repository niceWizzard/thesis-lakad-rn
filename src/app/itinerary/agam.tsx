import { Accordion, AccordionContent, AccordionHeader, AccordionIcon, AccordionItem, AccordionTitleText, AccordionTrigger } from '@/components/ui/accordion'
import { Box } from '@/components/ui/box'
import { Button, ButtonText } from '@/components/ui/button'
import { Checkbox, CheckboxGroup, CheckboxIcon, CheckboxIndicator, CheckboxLabel } from '@/components/ui/checkbox'
import { Input, InputField } from '@/components/ui/input'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { historicalLandmarks } from '@/src/constants/Landmarks'
import { useItineraryStore } from '@/src/stores/useItineraryStore'
import { useRouter } from 'expo-router'
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react-native'
import React, { useState } from 'react'
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
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
  const [maxDistance, setMaxDistance] = useState('')
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>(
    districtItems.map(v => v.id)
  )
  const [selectedCategories, setSelectedCategories] = useState<string[]>(categoryItems.map(v => v.id))

  const addItinerary = useItineraryStore(v => v.addItinerary)
  const router = useRouter()

  function onGenerateClick() {
    if (maxDistance.trim() !== '' && Number.isNaN(Number.parseFloat(maxDistance))) {
      alert("Invalid max distance!")
      return;
    }
    if (selectedDistricts.length == 0 || selectedCategories.length == 0) {
      alert("Cannot have empty categories or districts!")
      return
    }

    const id = Date.now().toString()
    // Add your generation logic here
    addItinerary({
      id: id,
      name: "Agam " + Date.now(),
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
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} >
        <Box className='p-4 w-full h-full'>
          <ScrollView
            contentContainerClassName='flex-1 gap-4'
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* District Filter */}
            <Accordion variant='filled' className='bg-transparent gap-4'>
              <AccordionItem value='a' className='rounded-lg'>
                <AccordionHeader>
                  <AccordionTrigger>
                    {({ isExpanded }: { isExpanded: boolean }) => {
                      return (
                        <>
                          <AccordionTitleText size='lg'>
                            Included District
                          </AccordionTitleText>
                          {isExpanded ? (
                            <AccordionIcon as={ChevronUpIcon} className="ml-3" />
                          ) : (
                            <AccordionIcon as={ChevronDownIcon} className="ml-3" />
                          )}
                        </>
                      );
                    }}
                  </AccordionTrigger>
                </AccordionHeader>
                <AccordionContent>
                  <CheckboxGroup
                    value={selectedDistricts}
                    onChange={(keys) => {
                      setSelectedDistricts(keys)
                    }}
                  >
                    <VStack>
                      {
                        districtItems.map(district => (
                          <Checkbox key={`district-${district.id}`} value={district.id} size='lg'>
                            <CheckboxIndicator>
                              <CheckboxIcon as={CheckIcon} />
                            </CheckboxIndicator>
                            <CheckboxLabel>{district.label}</CheckboxLabel>
                          </Checkbox>
                        ))
                      }
                    </VStack>
                  </CheckboxGroup>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value='b' className='rounded-lg'>
                <AccordionHeader>
                  <AccordionTrigger>
                    {({ isExpanded }: { isExpanded: boolean }) => {
                      return (
                        <>
                          <AccordionTitleText size='lg'>
                            Included Category
                          </AccordionTitleText>
                          {isExpanded ? (
                            <AccordionIcon as={ChevronUpIcon} className="ml-3" />
                          ) : (
                            <AccordionIcon as={ChevronDownIcon} className="ml-3" />
                          )}
                        </>
                      );
                    }}
                  </AccordionTrigger>
                </AccordionHeader>
                <AccordionContent>
                  <CheckboxGroup
                    value={selectedCategories}
                    onChange={(keys) => {
                      setSelectedCategories(keys)
                    }}
                  >
                    <VStack space='sm'>
                      {
                        categoryItems.map(category => (
                          <Checkbox key={`category-${category.id}`} value={category.id} size='lg'>
                            <CheckboxIndicator>
                              <CheckboxIcon as={CheckIcon} />
                            </CheckboxIndicator>
                            <CheckboxLabel>{category.label}</CheckboxLabel>
                          </Checkbox>
                        ))
                      }
                    </VStack>
                  </CheckboxGroup>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Max Distance Input */}
            <VStack space='sm'>
              <Text>
                Maximum Travel Distance
              </Text>
              <Input >

                <InputField
                  placeholder='0km'
                  value={maxDistance}
                  onChangeText={setMaxDistance}
                  keyboardType='numeric'
                />
              </Input>
              <Text size='xs'>
                Input distance to which the itinerary distance cannot exceed.
              </Text>
            </VStack>

            {/* Selected Filters Summary */}
            {(selectedDistricts.length > 0 || selectedCategories.length > 0) && (
              <Box className='p-4 bg-background-100 rounded-md'>
                <Text className='font-medium'>
                  Selected Filters:
                </Text>
                {selectedDistricts.length > 0 && (
                  <Text size='sm'>
                    Districts: {selectedDistricts.length} / {districtItems.length}
                  </Text>
                )}
                {selectedCategories.length > 0 && (
                  <Text size='sm'>
                    Categories: {selectedCategories.length} / {categoryItems.length}
                  </Text>
                )}
              </Box>
            )}
          </ScrollView>

          {/* Fixed button at bottom */}
          <Box >
            <Button
              onPress={onGenerateClick}
              size='lg'
            >
              <ButtonText>
                Generate
              </ButtonText>
            </Button>
          </Box>
        </Box>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  )
}

export default CreateWithAgamScreen