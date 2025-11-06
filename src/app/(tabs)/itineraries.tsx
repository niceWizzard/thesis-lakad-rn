import { StyleSheet } from 'react-native';

import { Text, View } from '@/src/components/Themed';

export default function ItinerariesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Itineraries Tab Here</Text>
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
