import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { Checkbox, CheckboxIcon, CheckboxIndicator, CheckboxLabel } from '@/components/ui/checkbox';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

const interests = [
  { id: 'churches', label: 'Churches' },
  { id: 'malls', label: 'Malls' },
  { id: 'hotels', label: 'Hotels' },
  { id: 'nature', label: 'Nature' },
  { id: 'restaurants', label: 'Restaurants' },
  { id: 'parks', label: 'Parks' },
];

const OnboardingScreen = () => {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const router = useRouter();

  const toggleInterest = (interestId: string) => {
    setSelectedInterests(prev =>
      prev.includes(interestId)
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    );
  };

  const handleDone = () => {
    router.replace('/(tabs)');
    AsyncStorage.setItem('haveOnboarded', 'true');
  };

  const isDoneDisabled = selectedInterests.length === 0;

  return (
    <VStack className="flex-1">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Box className="items-center mb-10 px-6 pt-10">
          <Text className="font-bold text-center mb-2 leading-8">
            Tell us what you're interested in!
          </Text>
          <Text className="text-center leading-6" >
            You can select more than one
          </Text>
        </Box>

        {/* Interests Grid */}
        <Box className="px-6">
          <Box className="flex-row flex-wrap justify-start gap-3">
            {interests.map((interest) => (
              <Checkbox
                key={interest.id}
                value={interest.id}
                isChecked={selectedInterests.includes(interest.id)}
                onChange={() => toggleInterest(interest.id)}
                className={`
                  flex-row items-center 
                   border border-gray-200 
                  rounded-xl py-3 px-4 mb-2
                `}
              >
                <CheckboxIndicator className="w-5 h-5 border-2 border-gray-300 rounded mr-2">
                  <CheckboxIcon className="text-blue-500" />
                </CheckboxIndicator>
                <CheckboxLabel size='md'>
                  {interest.label}
                </CheckboxLabel>
              </Checkbox>
            ))}
          </Box>
        </Box>
      </ScrollView>

      {/* Footer Buttons */}
      <Box className="flex-row justify-end items-center px-6 py-5 border-t border-gray-200 ">
        <Button
          onPress={handleDone}
          isDisabled={isDoneDisabled}
          action='primary'
        >
          <ButtonText size='md'>
            Save Changes
          </ButtonText>
        </Button>
      </Box>
    </VStack>
  );
};

// Minimal styles needed for scroll view
const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
});

export default OnboardingScreen;