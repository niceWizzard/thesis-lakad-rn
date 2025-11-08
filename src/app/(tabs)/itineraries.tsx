import { Box } from '@/components/ui/box';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Fab, FabIcon } from '@/components/ui/fab';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Input, InputField } from '@/components/ui/input';
import { Progress, ProgressFilledTrack } from '@/components/ui/progress';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { Itinerary } from '@/src/constants/Itineraries';
import { useItineraryStore } from '@/src/stores/useItineraryStore';
import { Stack, useRouter } from 'expo-router';
import { CheckCircle, Ellipsis, MapPin, Play, Search, Wand, X } from 'lucide-react-native';
import { useState } from 'react';

import {
  Alert,
  Dimensions,
  FlatList,
  Pressable
} from 'react-native';

const width = Dimensions.get('screen').width

export default function ItinerariesScreen() {
  const { itineraries, deleteItinerary } = useItineraryStore();
  const [searchString, setSearchString] = useState<string | null>(null)
  const showSearchInput = searchString !== null
  const router = useRouter();

  const handleDeleteItinerary = (itinerary: Itinerary) => {
    Alert.alert(
      'Delete Itinerary',
      `Are you sure you want to delete "${itinerary.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteItinerary(itinerary.id)
        }
      ]
    );
  };

  const getCompletedPOIs = (itinerary: Itinerary) => {
    return itinerary.poiOrder.filter(poi => poi.visited).length;
  };

  const formatPOICount = (itinerary: Itinerary) => {
    const total = itinerary.poiOrder.length;
    const completed = getCompletedPOIs(itinerary);
    return `${completed}/${total} POIs visited`;
  };

  const calculateProgress = (itinerary: Itinerary) => {
    if (itinerary.poiOrder.length === 0) return 0;
    return getCompletedPOIs(itinerary) / itinerary.poiOrder.length;
  };

  if (itineraries.length === 0) {
    return (
      <Box className='w-full h-full justify-center p-8 gap-4 items-center' >
        <Text size='4xl'>
          No Itineraries Yet
        </Text>
        <Text >
          Create your first itinerary to get started
        </Text>

        {/* Create Button */}
        <Button
          onPress={() => router.navigate('/itinerary/agam')}
          size='xl'
        >
          <ButtonIcon as={Wand} />
          <ButtonText >Create Itinerary</ButtonText>
        </Button>
      </Box>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            (
              showSearchInput ? (
                <Button variant='link' className='mx-6' size='xl'
                  onPress={() => {
                    setSearchString(null)
                  }}
                >
                  <ButtonIcon as={X} size='3xl' />
                </Button>
              ) : (
                <Button variant='link' className='mx-6' size='xl'
                  onPress={() => {
                    setSearchString('')
                  }}
                >
                  <ButtonIcon as={Search} size='3xl' />
                </Button>
              )
            )
          ),
          headerTitle: () => (
            showSearchInput ? (
              <Box style={{ width: width - 64 }}>
                <Input variant='underlined' size='lg'>
                  <InputField
                    autoFocus
                    placeholder="Search..."
                    value={searchString}
                    onChangeText={setSearchString}
                    autoCorrect={false}
                    autoCapitalize="none"
                    returnKeyType="search"
                  />
                </Input>
              </Box>
            ) : (
              <Text size='2xl'>Itinerary</Text>
            )
          ),
        }}
      />
      <Box className='h-full'>
        <FlatList
          data={itineraries.filter(v => {
            if (searchString == null)
              return true
            const a = RegExp(searchString, 'i')
            return a.test(v.name)
          })}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerClassName='gap-4 p-8'
          renderItem={({ item: itinerary }) => (
            <Pressable
              className='shadow-sm p-4 rounded-lg gap-3 bg-background-200'
              onPress={() => {
                router.navigate({
                  pathname: '/itinerary/[id]',
                  params: { id: itinerary.id },
                });
              }}
            >
              {/* Header */}
              <HStack className='justify-between items-center py-2'>
                <HStack space='md' className='items-center' >
                  <Icon
                    as={MapPin}
                  />
                  <Text size='lg' >
                    {itinerary.name}
                  </Text>
                </HStack>
                {/* More Options */}
                <Pressable
                  onPress={() => handleDeleteItinerary(itinerary)}
                >
                  <Icon
                    as={Ellipsis}
                  />
                </Pressable>
              </HStack>
              <VStack space='sm'>
                <Progress value={calculateProgress(itinerary) * 100}>
                  <ProgressFilledTrack />
                </Progress>
                <Text size='sm' >
                  {formatPOICount(itinerary)}
                </Text>
              </VStack>

              {/* POI Preview */}
              <VStack space='sm'>
                <Text size='md' >
                  Points of Interest:
                </Text>
                <VStack space='sm' >
                  {itinerary.poiOrder.slice(0, 3).map((poi, index) => (
                    <HStack space='sm' className='items-center' key={index}>
                      <Icon
                        as={poi.visited ? CheckCircle : MapPin}
                      />
                      <Text size='xs'
                        numberOfLines={1}
                      >
                        {poi.name}
                      </Text>
                    </HStack>
                  ))}
                  {itinerary.poiOrder.length > 3 && (
                    <Text size='xs'>
                      +{itinerary.poiOrder.length - 3} more
                    </Text>
                  )}
                </VStack>
              </VStack>

              {/* Action Buttons */}
              <Box>
                <Button
                  onPress={() => {
                    router.navigate({
                      pathname: '/itinerary/[id]',
                      params: { id: itinerary.id },
                    });
                  }}
                >
                  <ButtonIcon as={Play} />
                  <ButtonText>
                    Continue
                  </ButtonText>
                </Button>
              </Box>
            </Pressable>
          )}
        />

        {/* Floating Action Button */}
        <Fab
          onPress={() => router.navigate('/itinerary/agam')}
          size='xl'
        >
          <FabIcon as={Wand} />
        </Fab>
      </Box>
    </>
  );
}
