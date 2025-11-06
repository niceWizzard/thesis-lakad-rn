// src/components/FilterAccordion.tsx
import React, { useState } from 'react';
import {
    Pressable,
    Text,
    useColorScheme,
    View
} from 'react-native';

interface FilterItem {
  id: string;
  label: string;
}

interface FilterAccordionProps {
  title: string;
  items: FilterItem[];
  selectedItems: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  multiple?: boolean;
}

const FilterAccordion: React.FC<FilterAccordionProps> = ({ 
  title, 
  items, 
  selectedItems, 
  onSelectionChange,
  multiple = true 
}) => {
  const [expanded, setExpanded] = useState(false);
  const mode = useColorScheme();

  const toggleItem = (itemId: string) => {
    if (multiple) {
      if (selectedItems.includes(itemId)) {
        onSelectionChange(selectedItems.filter(id => id !== itemId));
      } else {
        onSelectionChange([...selectedItems, itemId]);
      }
    } else {
      // Single selection
      if (selectedItems.includes(itemId)) {
        onSelectionChange([]);
      } else {
        onSelectionChange([itemId]);
      }
    }
  };

  const isSelected = (itemId: string) => selectedItems.includes(itemId);

  return (
    <View style={{
      borderWidth: 1,
      borderColor: mode === 'dark' ? '#444' : '#ddd',
      borderRadius: 8,
      marginVertical: 8,
      overflow: 'hidden',
      backgroundColor: mode === 'dark' ? '#1a1a1a' : 'white',
    }}>
      <Pressable
        onPress={() => setExpanded(!expanded)}
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 16,
          backgroundColor: mode === 'dark' ? '#2a2a2a' : '#f9f9f9',
        }}
      >
        <Text style={{ 
          fontSize: 16, 
          fontWeight: '600',
          color: mode === 'dark' ? 'white' : 'black'
        }}>
          {title}
        </Text>
        <Text style={{ 
          fontSize: 16,
          color: mode === 'dark' ? 'white' : 'black'
        }}>
          {expanded ? '▲' : '▼'}
        </Text>
      </Pressable>
      
      {expanded && (
        <View style={{ padding: 8 }}>
          {items.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => toggleItem(item.id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 12,
                borderRadius: 6,
                marginVertical: 2,
                backgroundColor: isSelected(item.id) 
                  ? (mode === 'dark' ? '#333' : '#f0f0f0')
                  : 'transparent'
              }}
            >
              {/* Checkbox */}
              <View style={{
                width: 20,
                height: 20,
                borderWidth: 2,
                borderColor: mode === 'dark' ? 'white' : 'black',
                borderRadius: 4,
                marginRight: 12,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: isSelected(item.id) 
                  ? (mode === 'dark' ? 'white' : 'black')
                  : 'transparent'
              }}>
                {isSelected(item.id) && (
                  <Text style={{
                    color: mode === 'dark' ? 'black' : 'white',
                    fontSize: 12,
                    fontWeight: 'bold'
                  }}>
                    ✓
                  </Text>
                )}
              </View>
              
              <Text style={{
                color: mode === 'dark' ? 'white' : 'black',
                fontSize: 16
              }}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
};

export default FilterAccordion;