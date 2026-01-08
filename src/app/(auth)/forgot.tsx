import { Button, ButtonIcon, ButtonText } from '@/components/ui/button'
import { Input, InputField } from '@/components/ui/input'
import { Text } from '@/components/ui/text'
import { supabase } from '@/src/utils/supabase'
import { useRouter } from 'expo-router'
import { ArrowLeft, CheckCircle } from 'lucide-react-native'
import React, { useState } from 'react'
import { Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, View } from 'react-native'

const ForgotPasswordScreen = () => {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [emailSent, setEmailSent] = useState(false)
    const router = useRouter()

    const handleBack = () => {
        // Safe check for router context
        if (router.canGoBack()) {
            router.back()
        } else {
            router.replace('/signin') // Fallback if context is lost
        }
    }

    const handleResetPassword = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email address')
            return
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            Alert.alert('Error', 'Please enter a valid email address')
            return
        }

        setLoading(true)
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: "thesislakadrn://reset-password"
            })

            if (error) throw error
            setEmailSent(true)

        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to send reset email')
        } finally {
            setLoading(false)
        }
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                >
                    <View className="flex-1 justify-center p-6">

                        {/* 1. SHARED HEADER (Always mounted to preserve context) */}
                        <View className='items-center mb-8'>
                            <Button
                                variant="link"
                                size="sm"
                                onPress={handleBack}
                                className='self-start mb-4 p-0'
                                action='secondary'
                            >
                                <ButtonIcon as={ArrowLeft} className='text-typography-500' />
                                <ButtonText className='ml-1 font-medium text-typography-500'>Back</ButtonText>
                            </Button>
                        </View>

                        {/* 2. CONDITIONAL CONTENT */}
                        {!emailSent ? (
                            // FORM STATE
                            <View className='bg-background-50 p-8 rounded-2xl shadow-soft-2 border border-outline-100'>
                                <Text size='3xl' className='text-center font-bold mb-2 text-typography-900'>
                                    Forgot Password
                                </Text>
                                <Text size='lg' className='text-center text-typography-600 mb-6'>
                                    Enter your email to receive reset instructions
                                </Text>

                                <View className='mb-6'>
                                    <Text size='sm' className='text-typography-800 mb-1 font-medium'>
                                        Email Address
                                    </Text>
                                    <Input variant="outline" size="lg" className='rounded-lg'
                                        isDisabled={loading}
                                    >
                                        <InputField
                                            placeholder="you@example.com"
                                            value={email}
                                            onChangeText={setEmail}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            returnKeyType='done'
                                            onSubmitEditing={handleResetPassword}

                                        />
                                    </Input>
                                </View>

                                <Button
                                    action='primary'
                                    size="lg"
                                    onPress={handleResetPassword}
                                    isDisabled={loading || !email}
                                    className='rounded-lg'
                                >
                                    <ButtonText>{loading ? "Sending..." : 'Send Reset Link'}</ButtonText>
                                </Button>
                            </View>
                        ) : (
                            // SUCCESS STATE
                            <View className='bg-background-50 p-8 rounded-2xl shadow-soft-2 border border-outline-100 items-center'>
                                <View className='bg-success-100 p-4 rounded-full mb-4'>
                                    <CheckCircle size={48} color="#10b981" />
                                </View>
                                <Text size='3xl' className='font-bold text-typography-900 mb-2'>Check Email</Text>
                                <Text className='text-center text-typography-600 mb-6'>
                                    Instructions sent to <Text className="font-bold">{email}</Text>
                                </Text>

                                <Button
                                    className="w-full"
                                    variant="outline"
                                    onPress={() => setEmailSent(false)}
                                >
                                    <ButtonText>Resend Email</ButtonText>
                                </Button>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    )
}

export default ForgotPasswordScreen