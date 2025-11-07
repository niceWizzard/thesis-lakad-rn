import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

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
  const [countdown, setCountdown] = useState(5);
  const router = useRouter()

  

  // Countdown timer for skip button
  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

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

  const handleSkip = () => {
    if (countdown === 0) {
      router.replace('/(tabs)');
      AsyncStorage.setItem('haveOnboarded', 'true');
    }
  };

  const isDoneDisabled = selectedInterests.length === 0;

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Tell us what you're interested in!</Text>
          <Text style={styles.subtitle}>You can select more than one</Text>
        </View>

        {/* Interests Horizontal Row */}
        <View style={styles.interestsRow}>
          {interests.map((interest) => (
            <TouchableOpacity
              key={interest.id}
              style={[
                styles.interestButton,
                selectedInterests.includes(interest.id) && styles.interestButtonSelected,
              ]}
              onPress={() => toggleInterest(interest.id)}
            >
              <View style={styles.checkbox}>
                <View
                  style={[
                    styles.checkboxInner,
                    selectedInterests.includes(interest.id) && styles.checkboxInnerSelected,
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.interestText,
                  selectedInterests.includes(interest.id) && styles.interestTextSelected,
                ]}
              >
                {interest.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.skipButton,
            countdown > 0 && styles.skipButtonDisabled,
          ]}
          onPress={handleSkip}
          disabled={countdown > 0}
        >
          <Text style={[
            styles.skipButtonText,
            countdown > 0 && styles.skipButtonTextDisabled,
          ]}>
            Skip {countdown > 0 ? `(${countdown})` : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.doneButton,
            isDoneDisabled && styles.doneButtonDisabled,
          ]}
          onPress={handleDone}
          disabled={isDoneDisabled}
        >
          <Text style={[
            styles.doneButtonText,
            isDoneDisabled && styles.doneButtonTextDisabled,
          ]}>
            Done
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  interestsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 12,
  },
  interestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    flexShrink: 1,
    minWidth: 0, // Allow items to shrink properly
  },
  interestButtonSelected: {
    backgroundColor: '#E7F3FF',
    borderColor: '#007AFF',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#CED4DA',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxInner: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  checkboxInnerSelected: {
    backgroundColor: '#007AFF',
  },
  interestText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
    flexShrink: 1, // Allow text to wrap
  },
  interestTextSelected: {
    color: '#007AFF',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F3F4',
    backgroundColor: '#FFFFFF',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipButtonDisabled: {
    opacity: 0.5,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
  },
  skipButtonTextDisabled: {
    color: '#999999',
  },
  doneButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  doneButtonDisabled: {
    backgroundColor: '#E9ECEF',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  doneButtonTextDisabled: {
    color: '#ADB5BD',
  },
});

export default OnboardingScreen;