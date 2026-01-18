import { Box } from '@/components/ui/box';
import { Button, ButtonIcon } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Menu, MenuItem, MenuItemLabel } from '@/components/ui/menu';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { Check, EllipsisVertical, MapPin, Trash } from 'lucide-react-native';
import React, { useState } from 'react';
import { Landmark } from '../model/landmark.types';

const StopListItem = ({
    isVisited,
    landmark,
    onVisitToggle,
    onDelete,
    displayNumber,
    onLocate
}: {
    isVisited: boolean,
    landmark: Landmark,
    onVisitToggle: () => void,
    onDelete: () => void,
    displayNumber: number,
    onLocate: () => void,
}) => {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <HStack className='items-center justify-between'>
            <HStack space='md' className='flex-1 items-center min-w-0 justify-center'>
                <Box className={`w-8 h-8 rounded-full items-center justify-center ${isVisited ? 'bg-success-500' : 'bg-background-100'}`}>
                    {isVisited ? (
                        <Icon as={Check} size="xs" />
                    ) : (
                        <Text size='xs' className='font-bold text-typography-900'>
                            {displayNumber}
                        </Text>
                    )}
                </Box>

                <VStack className='flex-1 '>
                    <Text
                        className={`font-semibold ${isVisited ? 'text-typography-300 line-through' : 'text-typography-900'}`}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {landmark.name}
                    </Text>
                    <Text
                        size="xs"
                        className="text-typography-400"
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {landmark.municipality}
                    </Text>
                </VStack>
            </HStack>

            <Menu
                onClose={() => {
                    console.log("ONC LOSE")
                    setIsOpen(false)
                }}
                onOpen={() => {
                    console.log("ON OPEN")
                    setIsOpen(true)
                }}
                selectionMode="single"
                isOpen={isOpen}
                placement="left"
                trigger={({ ...triggerProps }) => {
                    return (
                        <Button
                            variant='link'
                            action='secondary'
                            {...triggerProps}
                            onPress={() => {
                                setIsOpen(true)
                                // bug in gluestack
                                triggerProps.onPress()
                            }}
                        >
                            <ButtonIcon as={EllipsisVertical} />
                        </Button>
                    );
                }}
                onSelectionChange={(s) => {
                    console.log("SELECTED!")
                    setIsOpen(false)
                }}
            >
                <MenuItem
                    key="Mark as visited" textValue={`Mark as ${isVisited ? 'Unvisited' : 'Visited'}`}
                    onPress={onVisitToggle}
                >
                    <Icon as={Check} size="sm" className="mr-2" />
                    <MenuItemLabel size="sm">Mark as {isVisited ? 'Unvisited' : 'Visited'}</MenuItemLabel>
                </MenuItem>
                <MenuItem
                    key="locate" textValue="Locate stop"
                    onPress={onLocate}
                >
                    <Icon as={MapPin} size="sm" className="mr-2" />
                    <MenuItemLabel size="sm">Locate Stop</MenuItemLabel>
                </MenuItem>
                <MenuItem
                    key="delete" textValue="Remove stop"
                    onPress={onDelete}
                >
                    <Icon as={Trash} size="sm" className="mr-2" />
                    <MenuItemLabel size="sm">Remove Stop</MenuItemLabel>
                </MenuItem>
            </Menu>
        </HStack>
    )
}

export default StopListItem