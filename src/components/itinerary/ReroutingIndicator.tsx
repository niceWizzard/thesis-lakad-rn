import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { RefreshCw } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

interface ReroutingIndicatorProps {
    visible: boolean;
}

/**
 * Non-invasive indicator shown when recalculating route
 * Displays at top of screen without blocking interaction
 */
export function ReroutingIndicator({ visible }: ReroutingIndicatorProps) {
    const slideAnim = useRef(new Animated.Value(-100)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const rotationRef = useRef<Animated.CompositeAnimation | null>(null);

    useEffect(() => {
        if (visible) {
            // Slide in from top
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 50,
                friction: 8,
                useNativeDriver: true,
            }).start();

            // Start rotation animation
            rotationRef.current = Animated.loop(
                Animated.timing(rotateAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                })
            );
            rotationRef.current.start();
        } else {
            // Stop rotation
            if (rotationRef.current) {
                rotationRef.current.stop();
                rotationRef.current = null;
            }

            // Reset rotation
            rotateAnim.setValue(0);

            // Slide out to top
            Animated.timing(slideAnim, {
                toValue: -100,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }

        return () => {
            // Cleanup on unmount
            if (rotationRef.current) {
                rotationRef.current.stop();
            }
        };
    }, [rotateAnim, slideAnim, visible]);

    const rotate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    if (!visible) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                { transform: [{ translateY: slideAnim }] }
            ]}
            pointerEvents="none"
        >
            <Box className="mx-4 mt-4 bg-primary-500 rounded-2xl shadow-lg">
                <HStack space="sm" className="items-center px-4 py-3">
                    <Animated.View style={{ transform: [{ rotate }] }}>
                        <Icon as={RefreshCw} size="sm" className="text-white" />
                    </Animated.View>
                    <Text size="sm" className="font-semibold text-white">
                        Recalculating route...
                    </Text>
                </HStack>
            </Box>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1500,
    },
});
