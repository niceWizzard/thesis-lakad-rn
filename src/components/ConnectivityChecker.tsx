import { Text } from '@/components/ui/text';
import * as Network from 'expo-network';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// components/ConnectivityChecker.tsx
const ConnectivityStatusBar = () => {
    const [networkState, setNetworkState] = useState<Network.NetworkState | null>(null);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        Network.getNetworkStateAsync().then(setNetworkState);
        const networkListener = Network.addNetworkStateListener(setNetworkState);
        return () => networkListener.remove();
    }, []);

    if (networkState?.isInternetReachable !== false) return null;

    return (
        <View
            style={{
                position: 'absolute', // Float above everything
                top: 0,
                left: 0,
                right: 0,
                zIndex: 9999,        // Highest priority
                paddingTop: insets.top,
                paddingBottom: 8,
                elevation: 10,       // Required for Android stacking
                justifyContent: 'center',
                alignItems: 'center',
            }}
            className='bg-error-800'
        >
            <Text className="text-white font-bold text-xs">
                No internet connection.
            </Text>
        </View>
    );
}
export default ConnectivityStatusBar;