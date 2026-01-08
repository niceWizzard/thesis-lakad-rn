import { Button, ButtonText } from '@/components/ui/button'
import { Input, InputField } from '@/components/ui/input'
import { Text } from '@/components/ui/text'
import { supabase } from '@/src/utils/supabase'
import React, { useState } from 'react'
import { Alert, View } from 'react-native'

const ForgotPasswordScreen = () => {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)

    const handleResetPassword = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email address')
            return
        }
        setLoading(true);
        try {
            // Generate redirect URL for mobile

            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: "thesislakadrn://reset-password"
            })

            if (error) throw error

            Alert.alert(
                'Email Sent',
                'Check your email for password reset instructions'
            )
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to send reset email')
        } finally {
            setLoading(false);
        }
    }
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16, }}>
            <View className='border-secondary-600 p-4 rounded-md border w-full gap-2' >
                <View>
                    <Text size='2xl' className='text-center'>Reset your Password</Text>
                    <Text size='md' className='text-center text-secondary-800'>We'll send you a link to reset your password on your provided email</Text>
                </View>
                <View className='gap-2 mb-4'>
                    <Text>Email</Text>
                    <Input
                        variant="outline"
                        size="md"
                    >
                        <InputField placeholder="juan@email.com" value={email} onChangeText={setEmail} />
                    </Input>
                </View>

                <Button action='primary'
                    onPress={handleResetPassword}
                    isDisabled={loading}
                >
                    <ButtonText>{loading ? "Sending..." : 'Send reset link'}</ButtonText>
                </Button>

            </View>
        </View>
    )
}

export default ForgotPasswordScreen