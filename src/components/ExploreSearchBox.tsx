import { Ionicons } from '@expo/vector-icons'
import React, { useState } from 'react'
import { Pressable, StyleSheet, TextInput, useColorScheme } from 'react-native'
import { View } from './Themed'

const ExploreSearchBox = ({
  onSearch,
  onFocus,
  onBlur,
  value // Add this
} : {
  onSearch: (s: string) => void
  onFocus?: () => void
  onBlur?: () => void
  value?: string // Add this
}) => {
  const [internalValue, setInternalValue] = useState('')
  const colorScheme = useColorScheme()
  
  // Use the external value if provided, otherwise use internal state
  const displayValue = value !== undefined ? value : internalValue;
  
  const handleChange = (text: string) => {
    if (value !== undefined) {
      // Controlled component
      onSearch(text);
    } else {
      // Uncontrolled component
      setInternalValue(text);
      onSearch(text);
    }
  };

  const handleClear = () => {
    if (value !== undefined) {
      onSearch('');
    } else {
      setInternalValue('');
      onSearch('');
    }
  };

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: colorScheme === 'dark' ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.95)',
        borderColor: colorScheme === 'dark' ? '#333' : '#ddd',
      }
    ]}>
      <Ionicons 
        name='search'
        size={20}
        color="#666"
        style={styles.searchIcon}
      />
      <TextInput 
        placeholder='Search for places...'
        placeholderTextColor="#666"
        value={displayValue}
        style={[
          styles.input,
          {
            color: colorScheme === 'dark' ? 'white' : 'black',
          }
        ]}
        onChangeText={handleChange}
        onFocus={onFocus}
        onBlur={onBlur}
        returnKeyType="search"
      />
      {displayValue.length > 0 && (
        <Pressable onPress={handleClear} style={styles.clearButton}>
          <Ionicons name="close-circle" size={18} color="#999" />
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        top: 24,
        left: 16,
        right: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        zIndex: 10,
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
    },
    searchIcon: {
        marginLeft: 12,
        marginRight: 8,
    },
    clearButton: {
        padding: 4,
        marginRight: 8,
    }
})

export default ExploreSearchBox