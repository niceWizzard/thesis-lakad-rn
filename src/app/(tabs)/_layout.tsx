import { Tabs } from 'expo-router'
import React from 'react'

const TabLayout = () => {
    return (
        <Tabs>
            <Tabs.Screen
                name="index"
                options={{
                    headerTitle: "Explore",
                }}
            />
        </Tabs>
    )
}

export default TabLayout