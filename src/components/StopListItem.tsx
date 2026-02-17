import { Box } from '@/components/ui/box';
import { Button, ButtonIcon } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Menu, MenuItem, MenuItemLabel } from '@/components/ui/menu';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { Check, Clock, EllipsisVertical, MapPin, Trash } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable } from 'react-native';
import { Landmark } from '../model/landmark.types';
import { formatDuration } from '../utils/format/time';

const StopListItem = ({
    isVisited,
    landmark,
    onVisitToggle,
    onDelete,
    displayNumber,
    onLocate,
    onPress,
    visitDuration,
    onEditDuration,
}: {
    isVisited: boolean,
    landmark: Landmark,
    onVisitToggle: () => void,
    onDelete: () => void,
    displayNumber: number,
    onLocate: () => void,
    onPress: () => void,
    visitDuration?: number,
    onEditDuration?: () => void,
}) => {
    const [isOpen, setIsOpen] = useState(false)

    const isPersonal = landmark.creation_type === "PERSONAL";
    const formattedDuration = visitDuration ? formatDuration(visitDuration) : null;

    return (
        <Pressable onPress={onPress}
            className='flex-row items-center justify-between'
        >
            <HStack space='md' className='flex-1 items-center min-w-0'>
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
                    <HStack space="xs" className="items-center">
                        <Text
                            className={`font-semibold ${isVisited ? 'text-typography-300 line-through' : 'text-typography-900'}`}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {landmark.name}
                        </Text>
                    </HStack>

                    <HStack space="sm" className="items-center">
                        <Text
                            size="xs"
                            className="text-typography-400"
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {isPersonal ? "Custom" : landmark.municipality}
                        </Text>
                        {formattedDuration && (
                            <>
                                <Box className="w-1 h-1 rounded-full bg-outline-300" />
                                <HStack space="xs" className="items-center">
                                    <Icon as={Clock} size="2xs" className="text-typography-400" />
                                    <Text size="xs" className="text-typography-400">
                                        {formattedDuration}
                                    </Text>
                                </HStack>
                            </>
                        )}
                    </HStack>
                </VStack>
            </HStack>

            <Menu
                onClose={() => {
                    setIsOpen(false)
                }}
                onOpen={() => {
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

                {onEditDuration && (
                    <MenuItem
                        key="edit_duration" textValue="Edit Visit Duration"
                        onPress={onEditDuration}
                    >
                        <Icon as={Clock} size="sm" className="mr-2" />
                        <MenuItemLabel size="sm">Edit Visit Duration</MenuItemLabel>
                    </MenuItem>
                )}

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
        </Pressable>
    )
}

export default StopListItem