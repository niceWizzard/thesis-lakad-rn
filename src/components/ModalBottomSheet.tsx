// src/components/ModalBottomSheet.tsx
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    PanResponder,
    StyleSheet,
    TouchableWithoutFeedback,
    useColorScheme,
    View,
} from 'react-native';
import { Text } from './Themed';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface BottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: number | string;
  maxHeight?: number | string;
  showBackdrop?: boolean;
  backdropOpacity?: number;
  enableSwipeToClose?: boolean;
  animationDuration?: number;
  isHideable?: boolean; // Add this prop
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  isVisible,
  onClose,
  children,
  height = '50%',
  maxHeight = '90%',
  showBackdrop = true,
  backdropOpacity = 0.5,
  enableSwipeToClose = true,
  animationDuration = 300,
  isHideable = true, // Default to true for backward compatibility
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Animation values
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacityAnim = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;

  // Calculate sheet height
  const sheetHeight = typeof height === 'string' 
    ? (parseInt(height) / 100) * SCREEN_HEIGHT 
    : height;

  const sheetMaxHeight = typeof maxHeight === 'string'
    ? (parseInt(maxHeight) / 100) * SCREEN_HEIGHT
    : maxHeight;

  // Pan responder for swipe gestures - disable if not hideable
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isHideable && enableSwipeToClose,
      onMoveShouldSetPanResponder: () => isHideable && enableSwipeToClose,
      onPanResponderMove: (_, gestureState) => {
        if (isHideable && gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isHideable && (gestureState.dy > 100 || gestureState.vy > 0.5)) {
          closeSheet();
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  // Open animation
  const openSheet = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: animationDuration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacityAnim, {
        toValue: backdropOpacity,
        duration: animationDuration,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Close animation - only close if hideable
  const closeSheet = () => {
    if (!isHideable) return; // Prevent closing if not hideable
    
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: animationDuration,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacityAnim, {
        toValue: 0,
        duration: animationDuration,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
      panY.setValue(0);
    });
  };

  // Reset position after incomplete swipe
  const resetPosition = () => {
    Animated.spring(panY, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  // Combined translateY (animation + gesture)
  const combinedTranslateY = Animated.add(
    translateY,
    panY
  ).interpolate({
    inputRange: [-SCREEN_HEIGHT, 0, SCREEN_HEIGHT],
    outputRange: [-SCREEN_HEIGHT, 0, SCREEN_HEIGHT],
    extrapolate: 'clamp',
  });

  // Handle visibility changes
  useEffect(() => {
    if (isVisible) {
      openSheet();
    } else if (isHideable) {
      closeSheet();
    }
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Backdrop - make non-clickable if not hideable */}
      {showBackdrop && (
        <TouchableWithoutFeedback 
          onPress={isHideable ? closeSheet : undefined} // Disable backdrop press if not hideable
        >
          <Animated.View 
            style={[
              styles.backdrop,
              {
                opacity: backdropOpacityAnim,
                backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)',
              }
            ]}
          />
        </TouchableWithoutFeedback>
      )}

      {/* Bottom Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            height: sheetHeight,
            maxHeight: sheetMaxHeight,
            backgroundColor: isDark ? '#1c1c1e' : '#ffffff',
            transform: [{ translateY: combinedTranslateY }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Handle - hide or show based on hideable state */}
        {isHideable && (
          <View style={styles.handleContainer}>
            <View 
              style={[
                styles.handle,
                { backgroundColor: isDark ? '#ffffff40' : '#00000040' }
              ]} 
            />
          </View>
        )}
        
        {/* Show a different indicator when not hideable */}
        {!isHideable && (
          <View style={styles.nonHideableIndicator}>
            <Text style={{ color: isDark ? '#fff' : '#000', fontSize: 12 }}>
              Required
            </Text>
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>
          {children}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  handleContainer: {
    paddingTop: 12,
    paddingBottom: 8,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  nonHideableIndicator: {
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});

export default BottomSheet;



// src/hooks/useBottomSheet.ts
import { useCallback, useState } from 'react';

export interface BottomSheetConfig {
  height?: number | string;
  maxHeight?: number | string;
  showBackdrop?: boolean;
  backdropOpacity?: number;
  enableSwipeToClose?: boolean;
  animationDuration?: number;
  defaultVisible?: boolean; // Add this
}

export const useBottomSheet = (defaultConfig?: BottomSheetConfig) => {
  const [isVisible, setIsVisible] = useState(defaultConfig?.defaultVisible ?? false); // Set default visibility
  const [config, setConfig] = useState<BottomSheetConfig>(defaultConfig || {});

  const show = useCallback((customConfig?: BottomSheetConfig) => {
    if (customConfig) {
      setConfig(customConfig);
    }
    setIsVisible(true);
  }, []);

  const hide = useCallback(() => {
    setIsVisible(false);
  }, []);

  const updateConfig = useCallback((newConfig: BottomSheetConfig) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  return {
    isVisible,
    show,
    hide,
    config,
    updateConfig,
  };
};