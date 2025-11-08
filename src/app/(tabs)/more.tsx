import { Box } from '@/components/ui/box';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useRouter } from "expo-router";
import React from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
} from "react-native";

import { Forward, Info, Option, Settings } from 'lucide-react-native';

const coverImage = require('@/assets/images/lakad-cover.png');

function MoreTab() {
  const router = useRouter()

  const menuItems = [
    {
      id: '1',
      title: 'Settings',
      icon: Settings,
      onPress: () => Alert.alert('Settings', 'Settings screen coming soon!'),
    },
    {
      id: '2',
      title: 'Preferences',
      icon: Option,
      onPress: () => router.navigate('/(more)/preferences'),
    },
    {
      id: '3',
      title: 'About',
      icon: Info,
      onPress: () => Alert.alert('About', 'Lakad App v1.0.0'),
    },
  ] as const;

  const handleItemPress = (item: typeof menuItems[number]) => {
    item.onPress();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header with Image */}
      <Box style={styles.header}>
        <Image
          source={coverImage}
          style={styles.coverImage}
          resizeMode="cover"
        />
        <Text style={styles.appTitle}>Lakad</Text>
        <Text style={[styles.appSubtitle]}>
          Your walking companion
        </Text>
      </Box>

      {/* Menu Items */}
      <Box style={styles.menuContainer}>
        {menuItems.map((item) => (
          <Button
            key={item.id}
            onPress={() => handleItemPress(item)}
            className='flex flex-row justify-between'
            size='lg'
            action='secondary'
          >
            <ButtonIcon
              size="md"
              as={item.icon}
            />
            <ButtonText style={styles.menuItemLeft}>
              {item.title}
            </ButtonText>
            <ButtonIcon
              size="md"
              as={Forward}
            />
          </Button>
        ))}
      </Box>

      {/* Footer */}
      <Box style={styles.footer}>
        <Text style={[styles.footerText]}>
          Version 1.0.0
        </Text>
      </Box>
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