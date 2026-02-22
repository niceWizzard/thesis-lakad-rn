import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { ScrollView } from "react-native";

const PlaceSkeleton = () => {
    return (
        <Box className="flex-1 bg-background-0">
            <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                {/* Hero Image Skeleton */}
                <Box className="w-full h-[350px] bg-background-200" />

                {/* Content Section */}
                <VStack className="px-6 py-8 -mt-10 bg-background-0 rounded-t-[40px] gap-6 min-h-[500px]">

                    {/* Title & Tags */}
                    <VStack className="gap-3">
                        <Box className="w-24 h-6 bg-background-200 rounded-lg" />
                        <Box className="w-3/4 h-10 bg-background-200 rounded-lg" />
                        <HStack className="items-center gap-2">
                            <Box className="w-4 h-4 bg-background-200 rounded-full" />
                            <Box className="w-1/2 h-4 bg-background-200 rounded-md" />
                        </HStack>
                    </VStack>

                    {/* Quick Stats Grid */}
                    <HStack className="justify-between bg-background-50 p-4 rounded-3xl border border-outline-50">
                        <VStack className="items-center flex-1 gap-2">
                            <Box className="w-6 h-6 bg-background-200 rounded-full" />
                            <Box className="w-12 h-4 bg-background-200 rounded-md" />
                            <Box className="w-20 h-3 bg-background-200 rounded-md" />
                        </VStack>
                        <Box className="w-[1px] h-full bg-outline-200" />
                        <VStack className="items-center flex-1 gap-2">
                            <Box className="w-6 h-6 bg-background-200 rounded-full" />
                            <Box className="w-24 h-4 bg-background-200 rounded-md" />
                            <Box className="w-20 h-3 bg-background-200 rounded-md" />
                        </VStack>
                    </HStack>

                    {/* Description */}
                    <VStack className="gap-3">
                        <HStack className="items-center gap-2">
                            <Box className="w-5 h-5 bg-background-200 rounded-full" />
                            <Box className="w-40 h-6 bg-background-200 rounded-md" />
                        </HStack>
                        <VStack className="gap-2">
                            <Box className="w-full h-4 bg-background-200 rounded-md" />
                            <Box className="w-full h-4 bg-background-200 rounded-md" />
                            <Box className="w-full h-4 bg-background-200 rounded-md" />
                            <Box className="w-2/3 h-4 bg-background-200 rounded-md" />
                        </VStack>
                    </VStack>

                    <Box className="h-[1px] w-full bg-outline-100 my-2" />

                    {/* Location Details */}
                    <VStack className="gap-3">
                        <Box className="w-32 h-6 bg-background-200 rounded-md" />
                        <Box className="bg-background-50 p-4 rounded-2xl border border-outline-100 h-20" />
                    </VStack>
                </VStack>
            </ScrollView>

            {/* Bottom Action Skeleton */}
            <Box className="p-6 bg-background-0 border-t border-outline-50">
                <Box className="w-full h-14 bg-background-200 rounded-2xl" />
            </Box>
        </Box>
    );
};

export default PlaceSkeleton;
