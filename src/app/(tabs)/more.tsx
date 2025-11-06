import { Text, View } from "@/src/components/Themed";
import React from 'react';
import { StyleSheet } from "react-native";

function MoreTab() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>More</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
});


export default MoreTab;