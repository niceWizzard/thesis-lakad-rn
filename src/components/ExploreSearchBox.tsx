import { Box } from '@/components/ui/box'
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input'
import { Search, X } from 'lucide-react-native'
import React, { useState } from 'react'
import { Pressable } from 'react-native'

const ExploreSearchBox = ({
    onSearch,
    onFocus,
    onBlur,
    value
}: {
    onSearch: (s: string) => void
    onFocus?: () => void
    onBlur?: () => void
    value?: string
}) => {
    const [internalValue, setInternalValue] = useState('')
    const displayValue = value !== undefined ? value : internalValue;

    const handleChange = (text: string) => {
        if (value === undefined) setInternalValue(text);
        onSearch(text);
    };

    const handleClear = () => {
        if (value === undefined) setInternalValue('');
        onSearch('');
    };

    return (
        <Box className='absolute top-12 left-4 right-4 shadow-soft-2 z-50'>
            <Input
                className='bg-background-0 border-outline-100 rounded-2xl h-14'
                variant='outline'
                size='xl'
            >
                <InputSlot className="pl-4">
                    <InputIcon as={Search} className="text-typography-400" />
                </InputSlot>
                <InputField
                    className="text-typography-900"
                    value={displayValue}
                    returnKeyType="search"
                    placeholder='Search for historical places...'
                    onChangeText={handleChange}
                    onFocus={onFocus}
                    onBlur={onBlur}
                />
                {displayValue.length > 0 && (
                    <InputSlot className="pr-4">
                        <Pressable onPress={handleClear}>
                            <InputIcon as={X} className="text-typography-400" />
                        </Pressable>
                    </InputSlot>
                )}
            </Input>
        </Box>
    )
}

export default ExploreSearchBox