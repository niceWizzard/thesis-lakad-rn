import { Image, TouchableOpacity } from "react-native";

import { Badge, BadgeText } from "@/components/ui/badge";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { ChevronRight, MapPin, Star } from "lucide-react-native";
import useThemeConfig from "../hooks/useThemeConfig";

const ITEM_HEIGHT = 114;

export const LandmarkListItem = ({ landmark, onPress }: { landmark: any, onPress: () => void }) => {
    const { primary } = useThemeConfig()
    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={onPress}
            className="bg-background-50 rounded-3xl border border-outline-100 shadow-soft-1 overflow-hidden"
            style={{ height: ITEM_HEIGHT }}
        >
            <HStack className="p-4 items-center gap-4">
                <Box className="w-20 h-20 bg-background-200 rounded-2xl overflow-hidden">
                    <Image source={{ uri: landmark.image_url || "https://via.placeholder.com/150" }} className="w-full h-full" resizeMode="cover" />
                </Box>
                <VStack className='flex-1 gap-1'>
                    <HStack className="justify-between items-start">
                        <HStack className="flex-wrap gap-1 flex-1">
                            <Badge action="info" variant="outline" className="rounded-md px-1">
                                <BadgeText className="text-[9px] uppercase font-bold">{landmark.type}</BadgeText>
                            </Badge>
                        </HStack>

                        <HStack className="items-center bg-primary-50 px-1.5 py-0.5 rounded-lg border border-primary-100">
                            <Icon as={Star} size='sm' color={primary['500']} className="mr-1" />
                            <Text size="xs" className="font-bold text-primary-700">{landmark.average_rating ?? '0'}</Text>
                        </HStack>
                    </HStack>

                    <Heading size="sm" className="text-typography-900" numberOfLines={1}>{landmark.name}</Heading>
                    <HStack space="xs" className="items-center">
                        <Icon as={MapPin} size="xs" className="text-typography-400" />
                        <Text size="xs" className="text-typography-500">{landmark.municipality.replace('_', ' ')} - District {landmark.district}</Text>
                    </HStack>
                </VStack>
                <Icon as={ChevronRight} className="text-typography-300 mr-1" />
            </HStack>
        </TouchableOpacity>
    );
};