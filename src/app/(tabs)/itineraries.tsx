import { Text, View } from '@/src/components/Themed';
import { Itinerary } from '@/src/constants/Itineraries';
import { useItineraryStore } from '@/src/stores/useItineraryStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  Alert,
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  useColorScheme
} from 'react-native';

const { width } = Dimensions.get('window');

export default function ItinerariesScreen() {
  const { itineraries, deleteItinerary } = useItineraryStore();
  const router = useRouter();
  const mode = useColorScheme();

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
      <View style={styles.emptyContainer}>
        <Ionicons 
          name="map-outline" 
          size={80} 
          color={mode === 'dark' ? '#666' : '#999'} 
        />
        <Text style={[styles.emptyTitle, { color: mode === 'dark' ? '#fff' : '#000' }]}>
          No Itineraries Yet
        </Text>
        <Text style={[styles.emptySubtitle, { color: mode === 'dark' ? '#999' : '#666' }]}>
          Create your first itinerary to get started
        </Text>
        
        {/* Create Button */}
        <Pressable
          onPress={() => router.navigate('/itinerary/agam')}
          style={({ pressed }) => [
            styles.createButton,
            {
              backgroundColor: mode === 'dark' ? '#3b82f6' : '#2563eb',
              opacity: pressed ? 0.8 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }]
            }
          ]}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.createButtonText}>Create Itinerary</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList 
        data={itineraries}
        keyExtractor={item => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: itinerary }) => (
          <Pressable 
            style={({ pressed }) => [
              styles.itineraryCard,
              {
                backgroundColor: mode === 'dark' ? '#1f2937' : '#ffffff',
                borderColor: mode === 'dark' ? '#374151' : '#e5e7eb',
                opacity: pressed ? 0.8 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }]
              }
            ]}
            onPress={() => {
              router.navigate({
                pathname: '/itinerary/[id]',
                params: { id: itinerary.id },
              });
            }}
          >
            {/* Header */}
            <View style={[styles.cardHeader, {
                backgroundColor: mode === 'dark' ? '#1f2937' : '#ffffff',
            }]}>
              <View style={[styles.titleContainer, 
                {
                  backgroundColor: mode === 'dark' ? '#1f2937' : '#ffffff',
                }
              ]}>
                <Ionicons 
                  name="location" 
                  size={20} 
                  color={mode === 'dark' ? '#60a5fa' : '#3b82f6'} 
                />
                <Text style={[
                  styles.itineraryName,
                  { color: mode === 'dark' ? '#f9fafb' : '#111827' }
                ]}>
                  {itinerary.name}
                </Text>
              </View>
              
              {/* More Options */}
              <Pressable
                onPress={() => handleDeleteItinerary(itinerary)}
                style={styles.moreButton}
              >
                <Ionicons 
                  name="ellipsis-horizontal" 
                  size={16} 
                  color={mode === 'dark' ? '#9ca3af' : '#6b7280'} 
                />
              </Pressable>
            </View>

            {/* Progress Bar */}
            <View style={[styles.progressContainer, {backgroundColor: mode === 'dark' ? '#1f2937' : '#ffffff',}]}>
              <View style={[
                styles.progressBar,
                { backgroundColor: mode === 'dark' ? '#374151' : '#f3f4f6' }
              ]}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${calculateProgress(itinerary) * 100}%`,
                      backgroundColor: mode === 'dark' ? '#10b981' : '#059669'
                    }
                  ]} 
                />
              </View>
              <Text style={[
                styles.progressText,
                { color: mode === 'dark' ? '#d1d5db' : '#6b7280', 
                  backgroundColor: mode === 'dark' ? '#1f2937' : '#ffffff',
                }
              ]}>
                {formatPOICount(itinerary)}
              </Text>
            </View>

            {/* POI Preview */}
            <View style={[styles.poiPreview, {backgroundColor: mode === 'dark' ? '#1f2937' : '#ffffff',}]}>
              <Text style={[
                styles.poiPreviewTitle,
                { color: mode === 'dark' ? '#9ca3af' : '#6b7280' }
              ]}>
                Points of Interest:
              </Text>
              <View style={[styles.poiList, {backgroundColor: mode === 'dark' ? '#1f2937' : '#ffffff',}]}>
                {itinerary.poiOrder.slice(0, 3).map((poi, index) => (
                  <View key={index} style={[styles.poiItem, {backgroundColor: mode === 'dark' ? '#1f2937' : '#ffffff',}]}>
                    <Ionicons 
                      name={poi.visited ? "checkmark-circle" : "location-outline"} 
                      size={14} 
                      color={poi.visited 
                        ? (mode === 'dark' ? '#10b981' : '#059669') 
                        : (mode === 'dark' ? '#6b7280' : '#9ca3af')
                      } 
                    />
                    <Text 
                      style={[
                        styles.poiName,
                        { 
                          color: mode === 'dark' ? '#e5e7eb' : '#4b5563',
                          textDecorationLine: poi.visited ? 'line-through' : 'none'
                        }
                      ]}
                      numberOfLines={1}
                    >
                      {poi.name}
                    </Text>
                  </View>
                ))}
                {itinerary.poiOrder.length > 3 && (
                  <Text style={[
                    styles.morePOIs,
                    { color: mode === 'dark' ? '#6b7280' : '#9ca3af' }
                  ]}>
                    +{itinerary.poiOrder.length - 3} more
                  </Text>
                )}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={[styles.actionButtons, {backgroundColor: mode === 'dark' ? '#1f2937' : '#ffffff',}]}>
              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  {
                    backgroundColor: mode === 'dark' ? '#374151' : '#f3f4f6',
                    opacity: pressed ? 0.7 : 1
                  }
                ]}
                onPress={() => {
                  router.navigate({
                    pathname: '/itinerary/[id]',
                    params: { id: itinerary.id },
                  });
                }}
              >
                <Ionicons 
                  name="play" 
                  size={16} 
                  color={mode === 'dark' ? '#60a5fa' : '#3b82f6'} 
                />
                <Text style={[
                  styles.actionButtonText,
                  { color: mode === 'dark' ? '#60a5fa' : '#3b82f6' }
                ]}>
                  Continue
                </Text>
              </Pressable>
            </View>
          </Pressable>
        )}
      />
      
      {/* Floating Action Button */}
      <Pressable
        onPress={() => router.navigate('/itinerary/agam')}
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: mode === 'dark' ? '#3b82f6' : '#2563eb',
            shadowColor: mode === 'dark' ? '#000' : '#6b7280',
            transform: [{ scale: pressed ? 0.95 : 1 }]
          }
        ]}
      >
        <Ionicons name="color-wand" size={24} color="white" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
    width: '100%',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  itineraryCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,

  },
  itineraryName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  moreButton: {
    padding: 4,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
  },
  poiPreview: {
    marginBottom: 12,
  },
  poiPreviewTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  poiList: {
    gap: 4,
  },
  poiItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  poiName: {
    fontSize: 14,
    flex: 1,
  },
  morePOIs: {
    fontSize: 12,
    fontStyle: 'italic',
    marginLeft: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});