import { supabase } from '@/src/utils/supabase'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'expo-router'
import React, { useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, ScrollView, TextInput, TouchableWithoutFeedback, View } from 'react-native'
import * as z from 'zod'

import { Button, ButtonIcon, ButtonText } from '@/components/ui/button'
import { Heading } from '@/components/ui/heading'
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input'
import { Text } from '@/components/ui/text'
import { Toast, ToastDescription, ToastTitle, useToast } from '@/components/ui/toast'
import { AlertCircle, Lock, LogIn, Mail } from 'lucide-react-native'

// Validation Schema
const signinSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(1, "Password is required"),
})

type SigninSchema = z.infer<typeof signinSchema>

const SigninPage = () => {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const toast = useToast()

    // Ref for keyboard navigation
    const passwordRef = useRef<TextInput>(null)

    const { control, handleSubmit, formState: { errors, dirtyFields, isValid: isFormValid } } = useForm<SigninSchema>({
        resolver: zodResolver(signinSchema),
        defaultValues: { email: '', password: '' },
        mode: "onChange"
    })

    // Reusable Toast Helper
    const showToast = (title: string, description: string) => {
        toast.show({
            placement: "top",
            duration: 1500,
            render: ({ id }) => (
                <Toast nativeID={"toast-" + id} action="error">
                    <View className="flex-row items-center gap-3">
                        <AlertCircle size={20} color="#dc2626" />
                        <View>
                            <ToastTitle className="font-bold">{title}</ToastTitle>
                            <ToastDescription>{description}</ToastDescription>
                        </View>
                    </View>
                </Toast>
            ),
        })
    }

    const onSignin = async (data: SigninSchema) => {
        setLoading(true);
        try {
            const { data: { session }, error } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            });

            if (error) throw error;

            if (session) {
                router.replace('/');
            }
        } catch (error: any) {
            showToast("Login Failed", error.message || "Please check your credentials.")
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="bg-background-0"
            style={{ flex: 1 }}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    className="px-6"
                    keyboardShouldPersistTaps="handled"
                >
                    <View className="flex-1 justify-center max-w-[400px] w-full self-center py-10">

                        <View className="mb-10 items-center">
                            <Heading size="3xl" className="text-typography-900 mb-2">Welcome Back </Heading>
                            <Text size="md" className="text-typography-500">Sign in to your account</Text>
                        </View>

                        <View className="bg-background-50 p-6 rounded-3xl border border-outline-100 shadow-soft-1">
                            <View className="gap-5">

                                {/* Email Field */}
                                <View className="gap-1">
                                    <Text size="sm" className="font-medium text-typography-700 ml-1">Email</Text>
                                    <Controller
                                        control={control}
                                        name="email"
                                        render={({ field: { onChange, onBlur, value } }) => (
                                            <Input variant="outline" size="lg" isInvalid={!!errors.email && dirtyFields.email}>
                                                <InputSlot className="pl-4">
                                                    <InputIcon as={Mail} className="text-typography-400" />
                                                </InputSlot>
                                                <InputField
                                                    placeholder="name@example.com"
                                                    onBlur={onBlur}
                                                    onChangeText={onChange}
                                                    value={value}
                                                    autoCapitalize="none"
                                                    keyboardType="email-address"
                                                    returnKeyType="next"
                                                    submitBehavior='submit'
                                                    onSubmitEditing={() => passwordRef.current?.focus()}
                                                />
                                            </Input>
                                        )}
                                    />
                                    {errors.email && dirtyFields.email && (
                                        <Text size="xs" className="text-error-600 ml-1">{errors.email.message}</Text>
                                    )}
                                </View>

                                {/* Password Field */}
                                <View className="gap-1">
                                    <View className="flex-row justify-between items-center ml-1">
                                        <Text size="sm" className="font-medium text-typography-700">Password</Text>
                                        <Button
                                            variant="link"
                                            className="p-0 h-auto"
                                            onPress={() => router.navigate('/(auth)/forgot')}
                                        >
                                            <ButtonText size="xs" className="text-primary-600 font-semibold">Forgot password?</ButtonText>
                                        </Button>
                                    </View>
                                    <Controller
                                        control={control}
                                        name="password"
                                        render={({ field: { onChange, onBlur, value } }) => (
                                            <Input variant="outline" size="lg" isInvalid={!!errors.password && dirtyFields.password}>
                                                <InputSlot className="pl-4">
                                                    <InputIcon as={Lock} className="text-typography-400" />
                                                </InputSlot>
                                                <InputField
                                                    ref={passwordRef as any}
                                                    placeholder="Enter password"
                                                    type="password"
                                                    autoCapitalize="none"
                                                    onBlur={onBlur}
                                                    onChangeText={onChange}
                                                    value={value}
                                                    onSubmitEditing={handleSubmit(onSignin)}
                                                />
                                            </Input>
                                        )}
                                    />
                                    {errors.password && dirtyFields.password && (
                                        <Text size="xs" className="text-error-600 ml-1">{errors.password.message}</Text>
                                    )}
                                </View>

                                <Button
                                    size="lg"
                                    className="rounded-xl mt-2 bg-primary-600"
                                    onPress={handleSubmit(onSignin)}
                                    isDisabled={!isFormValid || loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator size="small" color="white" />
                                    ) : (
                                        <>
                                            <ButtonText className="font-bold">Sign In</ButtonText>
                                            <ButtonIcon as={LogIn} className="ml-2" />
                                        </>
                                    )}
                                </Button>
                            </View>

                            <View className="flex-row justify-center items-center gap-1 mt-8 border-t border-outline-100 pt-6">
                                <Text size="sm" className="text-typography-500">Don't have an account?</Text>
                                <Button
                                    variant="link"
                                    className="p-0 h-auto"
                                    onPress={() => router.replace('/(auth)/signup')}
                                >
                                    <ButtonText size="sm" className="text-primary-600 font-bold">Sign up</ButtonText>
                                </Button>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    )
}

export default SigninPage