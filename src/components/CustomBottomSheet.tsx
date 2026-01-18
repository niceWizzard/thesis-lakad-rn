import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useIsFocused } from '@react-navigation/native';
import React, { ComponentProps, RefObject, useEffect } from 'react';
import { BackHandler } from 'react-native';

const CustomBottomSheet = ({
    isBottomSheetOpened,
    children,
    snapPoints,
    onBackdropPress,
    bottomSheetRef,
    ...props
}: {
    bottomSheetRef: RefObject<BottomSheet | null>,
    isBottomSheetOpened: boolean,
    onBackdropPress?: () => void,
} & React.PropsWithChildren<ComponentProps<typeof BottomSheet>>) => {

    const isFocused = useIsFocused()

    useEffect(() => {
        const backAction = () => {
            if (isFocused && isBottomSheetOpened) {
                bottomSheetRef.current?.close(); // Trigger the close animation/logic
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
    }, [isFocused, isBottomSheetOpened]);


    // Backdrop component to allow closing by clicking the map
    const renderBackdrop = React.useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                appearsOnIndex={0}
                disappearsOnIndex={-1}
                style={{
                    zIndex: 100,
                }}
                onPress={onBackdropPress}
            />
        ),
        []
    );

    return (
        <BottomSheet
            ref={bottomSheetRef}
            index={-1} // Start closed
            snapPoints={snapPoints}
            backdropComponent={renderBackdrop}
            containerStyle={{
                zIndex: 200,
            }}
            {...props}
        >
            {children}
        </BottomSheet>
    )
}

export default CustomBottomSheet    