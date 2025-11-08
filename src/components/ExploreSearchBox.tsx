import { Box } from '@/components/ui/box'
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input'
import { Search } from 'lucide-react-native'
import React, { useState } from 'react'

const ExploreSearchBox = ({
  onSearch,
  onFocus,
  onBlur,
  value // Add this
}: {
  onSearch: (s: string) => void
  onFocus?: () => void
  onBlur?: () => void
  value?: string // Add this
}) => {
  const [internalValue, setInternalValue] = useState('')
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
    <Box
      className='absolute top-8 left-4 right-4 '
    >
      <Input
        className='w-full bg-background-0 px-4'
        variant='rounded'
        size='2xl'
      >
        <InputField
          value={displayValue}
          returnKeyType="search"
          placeholder='Search for places...'
          onChangeText={handleChange}
          onFocus={onFocus}
          onBlur={onBlur}
        />
        <InputSlot>
          <InputIcon as={Search} />
        </InputSlot>
      </Input>
    </Box>
  )
}


export default ExploreSearchBox