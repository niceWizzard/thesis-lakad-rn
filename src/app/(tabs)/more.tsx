import { Text, View } from "@/src/components/Themed";
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    useColorScheme
} from "react-native";

const coverImage = require('@/assets/images/lakad-cover.png');

type MenuItem = {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

function MoreTab() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const menuItems: MenuItem[] = [
    {
      id: '1',
      title: 'Settings',
      icon: 'settings-outline',
      onPress: () => Alert.alert('Settings', 'Settings screen coming soon!'),
    },
    {
      id: '2',
      title: 'Preferences',
      icon: 'options-outline',
      onPress: () => Alert.alert('Preferences', 'Preferences screen coming soon!'),
    },
    {
      id: '3',
      title: 'About',
      icon: 'information-circle-outline',
      onPress: () => Alert.alert('About', 'Lakad App v1.0.0'),
    },
  ];

  const handleItemPress = (item: MenuItem) => {
    item.onPress();
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header with Image */}
      <View style={styles.header}>
        <Image 
          source={coverImage}
          style={styles.coverImage}
          resizeMode="cover"
        />
        <Text style={styles.appTitle}>Lakad</Text>
        <Text style={[styles.appSubtitle, { color: isDark ? '#ccc' : '#666' }]}>
          Your walking companion
        </Text>
      </View>

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.menuItem, 
              { 
                borderColor: isDark ? '#333' : '#e0e0e0',
                backgroundColor: isDark ? '#1a1a1a' : '#f8f8f8',
              }
            ]}
            onPress={() => handleItemPress(item)}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons 
                name={item.icon} 
                size={22} 
                color={isDark ? '#fff' : '#000'} 
              />
              <Text style={styles.menuItemText}>{item.title}</Text>
            </View>
            <Ionicons 
              name="chevron-forward" 
              size={18} 
              color={isDark ? '#666' : '#999'} 
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: isDark ? '#888' : '#666' }]}>
          Version 1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 16,
  },
  coverImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuContainer: {
    gap: 12,
    marginBottom: 32,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 14,
  },
});

export default MoreTab;