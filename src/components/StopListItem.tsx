import { AlertDialog, AlertDialogBackdrop, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader } from '@/components/ui/alert-dialog';
import { Box } from '@/components/ui/box';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { Check, ChevronDown, ChevronUp, Clock, Info, MapPin, Trash } from 'lucide-react-native';
import React, { useState } from 'react';
import { LayoutAnimation, Pressable, TouchableOpacity } from 'react-native';
import { Place } from '../model/places.types';
import { formatDuration } from '../utils/format/time';

const StopListItem = ({
    isVisited,
    landmark,
    onVisitToggle,
    onDelete,
    displayNumber,
    onLocate,
    onShowStopInfo,
    visitDuration,
    onEditDuration,
}: {
    isVisited: boolean,
    landmark: Place,
    onVisitToggle: () => void,
    onDelete: () => void,
    displayNumber: number,
    onLocate: () => void,
    onShowStopInfo: () => void,
    visitDuration?: number,
    onEditDuration?: () => void,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const isPersonal = landmark.creation_type === "PERSONAL";
    const formattedDuration = visitDuration ? formatDuration(visitDuration) : null;

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsExpanded(!isExpanded);
    };

    return (
        <VStack>
            <Pressable onPress={toggleExpand}
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

                        <HStack space="xs" className="items-center">
                            <Icon as={MapPin} size="sm" className="text-typography-400" />
                            <Text
                                className="text-typography-400"
                                numberOfLines={1}
                                ellipsizeMode="tail"
                                size="sm"
                            >
                                {isPersonal ? "Custom" : landmark.municipality}
                            </Text>
                            {formattedDuration && (
                                <>
                                    <Icon as={Clock} size="sm" className="text-typography-400" />
                                    <Text className="text-typography-400"
                                        size="sm"
                                    >
                                        Stay: {formattedDuration}
                                    </Text>
                                </>
                            )}
                        </HStack>
                    </VStack>
                </HStack>

                <Button
                    variant='link'
                    action='secondary'
                    onPress={toggleExpand}
                >
                    <ButtonIcon as={isExpanded ? ChevronUp : ChevronDown} />
                </Button>
            </Pressable>

            {isExpanded && (
                <VStack className='pt-3 mt-3 pl-7'>
                    <Box className='h-[1px] bg-outline-100 ml-4' />
                    <HStack className='pt-3 justify-around items-center'>
                        <TouchableOpacity onPress={() => { toggleExpand(); onVisitToggle(); }} className='items-center w-16'>
                            <Box className='bg-background-100 p-2.5 rounded-full mb-1.5'>
                                <Icon as={Check} size='md' className={isVisited ? 'text-typography-500' : 'text-primary-600'} />
                            </Box>
                            <Text size='2xs' className='text-typography-600 font-medium text-center'>{isVisited ? 'Unvisit' : 'Visited'}</Text>
                        </TouchableOpacity>

                        {onEditDuration && (
                            <TouchableOpacity onPress={() => { toggleExpand(); onEditDuration(); }} className='items-center w-16'>
                                <Box className='bg-background-100 p-2.5 rounded-full mb-1.5'>
                                    <Icon as={Clock} size='md' className='text-primary-600' />
                                </Box>
                                <Text size='2xs' className='text-typography-600 font-medium text-center'>Stay</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity onPress={() => { toggleExpand(); onLocate(); }} className='items-center w-16'>
                            <Box className='bg-background-100 p-2.5 rounded-full mb-1.5'>
                                <Icon as={MapPin} size='md' className='text-primary-600' />
                            </Box>
                            <Text size='2xs' className='text-typography-600 font-medium text-center'>Locate</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => { toggleExpand(); onShowStopInfo(); }} className='items-center w-16'>
                            <Box className='bg-background-100 p-2.5 rounded-full mb-1.5'>
                                <Icon as={Info} size='md' className='text-primary-600' />
                            </Box>
                            <Text size='2xs' className='text-typography-600 font-medium text-center'>Info</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => { toggleExpand(); setShowDeleteDialog(true); }} className='items-center w-16'>
                            <Box className='bg-error-50 p-2.5 rounded-full mb-1.5'>
                                <Icon as={Trash} size='md' className='text-error-600' />
                            </Box>
                            <Text size='2xs' className='text-error-600 font-medium text-center'>Remove</Text>
                        </TouchableOpacity>
                    </HStack>
                </VStack>
            )}
            {/* Deletion Confirmation Modal */}
            <AlertDialog
                isOpen={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                size="md"
            >
                <AlertDialogBackdrop />
                <AlertDialogContent className='rounded-3xl'>
                    <AlertDialogHeader>
                        <Heading size="md" className="text-typography-950 font-semibold">
                            Remove Stop
                        </Heading>
                    </AlertDialogHeader>
                    <AlertDialogBody className="mt-3 mb-4">
                        <Text size="sm">
                            Are you sure you want to remove <Text size="sm" className='font-bold text-typography-900'>{landmark.name}</Text> from your itinerary?
                        </Text>
                    </AlertDialogBody>
                    <AlertDialogFooter className="gap-3">
                        <Button
                            variant="outline"
                            action="secondary"
                            className='rounded-xl'
                            onPress={() => setShowDeleteDialog(false)}
                        >
                            <ButtonText>Cancel</ButtonText>
                        </Button>
                        <Button
                            action="negative"
                            className='rounded-xl'
                            onPress={() => {
                                setShowDeleteDialog(false);
                                onDelete();
                            }}
                        >
                            <ButtonText>Remove</ButtonText>
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </VStack>
    )
}

export default StopListItem