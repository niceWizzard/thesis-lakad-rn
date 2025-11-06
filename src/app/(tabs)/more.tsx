import { Text, View } from "@/src/components/Themed";
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, useColorScheme } from "react-native";

const coverImage = require('@/assets/images/lakad-cover.png')

function MoreTab() {
    const colorScheme = useColorScheme()
    return (
        <View style={styles.container}>
            <Image 
                source={coverImage}
            />
            <TouchableOpacity
            style={[styles.item, {
                borderColor: colorScheme === 'dark' ? 'white' : 'black',
            }]}
            >
                <Text >Settings</Text>
            </TouchableOpacity>
             <TouchableOpacity
            style={[styles.item, {
                borderColor: colorScheme === 'dark' ? 'white' : 'black',
            }]}
            >
                <Text >Preferences</Text>
            </TouchableOpacity>
             <TouchableOpacity
            style={[styles.item, {
                borderColor: colorScheme === 'dark' ? 'white' : 'black',
            }]}
            >
                <Text >About</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: 8,
        gap: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    item: {
        width: "100%",
        padding: 8,
        borderRadius: 8,
        borderWidth: 1,
    }
});


export default MoreTab;