import { FlatList, Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/src/components/Themed';
import { useItineraryStore } from '@/src/stores/useItineraryStore';
import { useRouter } from 'expo-router';

export default function ItinerariesScreen() {
  const {itineraries} = useItineraryStore()
  const router = useRouter()
  return (
    <View style={styles.container}>
      <FlatList 
        data={itineraries}
        keyExtractor={v => v.id}
        style={{flex: 1,  width: '100%', padding: 8,}}
        contentContainerStyle={{gap: 8}}
        renderItem={({item: itinerary}) => (
          <Pressable style={{
            padding: 24,
            backgroundColor: 'gray',
            width: '100%'
          }}
            onPress={() => {
              router.navigate({
                pathname: '/itinerary/[id]',
                params: {
                  id: itinerary.id.toString(),
                },
              })
            }}
          >
            <Text style={{fontSize: 18, fontWeight: 'bold'}}>{itinerary.name}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
