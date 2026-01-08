import { Text } from '@/components/ui/text';
import * as Network from 'expo-network';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ConnectivityChecker = () => {
    const [networkState, setNetworkState] = useState<Network.NetworkState | null>(null);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        Network.getNetworkStateAsync().then(setNetworkState);
        const networkListener = Network.addNetworkStateListener(setNetworkState);
        return () => networkListener.remove();
    }, []);

    // If internet is reachable, we don't want to render anything (0 height)
    if (networkState?.isInternetReachable !== false)
        return <View style={{
            paddingTop: insets.top,
        }} className='bg-background-0'>

        </View>;

    return (
        <View
            style={{
                paddingTop: insets.top,
                paddingBottom: 8,
                width: '100%',
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

export default ConnectivityChecker;