import { Text } from '@/components/ui/text';
import * as Network from 'expo-network';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
const ConnectivityChecker = () => {

    const [bgColor, setBgColor] = useState('gray')
    const [networkState, setNetworkState] = useState<Network.NetworkState | null>(null);

    useEffect(() => {
        // Fetch initial state
        const fetchInitialState = async () => {
            const state = await Network.getNetworkStateAsync();
            setNetworkState(state);
        };
        fetchInitialState();

        // Subscribe to network changes
        const networkListener = Network.addNetworkStateListener((state) => {
            setNetworkState(state);
        });

        // Cleanup: Remove listener when component unmounts
        return () => {
            networkListener.remove();
        };
    }, []);

    if (networkState?.isInternetReachable) {
        return null;
    }

    return (
        <SafeAreaView
            edges={['top', 'left', 'right']}
            style={{
                backgroundColor: bgColor,
                paddingBottom: 8,
                justifyContent: 'center',
                alignItems: 'center',
            }}>
            <Text >No internet connection.</Text>
        </SafeAreaView>
    )
}

export default ConnectivityChecker