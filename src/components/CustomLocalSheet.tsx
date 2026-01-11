import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { useIsFocused } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    BackHandler // Import BackHandler
    ,





    Dimensions,
    Pressable,
    StyleSheet
} from 'react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface CustomLocalSheetProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

export const CustomLocalSheet = ({ isOpen, onClose, children }: CustomLocalSheetProps) => {
    const [shouldRender, setShouldRender] = useState(isOpen);
    const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    const isFocused = useIsFocused()

    // --- BackHandler Logic ---
    useEffect(() => {
        const backAction = () => {
            if (isFocused && isOpen) {
                onClose(); // Trigger the close animation/logic
                return true; // Return true to prevent default behavior (app exit/nav back)
            }
            return false; // Return false to let the system handle it if sheet is closed
        };

        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            backAction
        );

        // Cleanup the listener when the component unmounts
        return () => backHandler.remove();
    }, [isOpen, onClose, isFocused]);

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                damping: 20,
                stiffness: 90,
            }).start();
        } else {
            Animated.timing(translateY, {
                toValue: SCREEN_HEIGHT,
                duration: 250,
                useNativeDriver: true,
            }).start(() => {
                setShouldRender(false);
            });
        }
    }, [isOpen]);

    if (!shouldRender) return null;

    return (
        <Box
            style={[StyleSheet.absoluteFill, { zIndex: 1000 }]}
            className="justify-end"
            pointerEvents={isOpen ? 'auto' : 'none'}
        >
            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    {
                        opacity: translateY.interpolate({
                            inputRange: [0, SCREEN_HEIGHT],
                            outputRange: [1, 0]
                        }),
                        backgroundColor: 'rgba(0,0,0,0.6)',
                    }
                ]}
            >
                <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={onClose}
                />
            </Animated.View>

            <Animated.View
                style={{
                    transform: [{ translateY }],
                    zIndex: 1001,
                }}
            >
                <Box
                    className="bg-background-0 rounded-t-[32px] pb-10 pt-2 shadow-lg"
                    style={{ minHeight: 200, maxHeight: SCREEN_HEIGHT * 0.8 }}
                >
                    <VStack className="p-4">
                        {children}
                    </VStack>
                </Box>
            </Animated.View>
        </Box>
    );
};