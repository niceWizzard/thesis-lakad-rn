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
import { AlertCircle, CheckCircle2, Lock, Mail, UserPlus } from 'lucide-react-native'

const signupSchema = z.object({
    email: z.string().email("Please enter a valid email"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Include at least one uppercase letter")
        .regex(/[0-9]/, "Include at least one number"),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type SignupSchema = z.infer<typeof signupSchema>;

const SignupPage = () => {
    const router = useRouter()
    const toast = useToast()
    const [loading, setLoading] = useState(false)

    // Refs for keyboard navigation
    const passwordRef = useRef<TextInput>(null)
    const confirmPasswordRef = useRef<TextInput>(null)

    const { control, handleSubmit, formState: { errors, dirtyFields } } = useForm<SignupSchema>({
        resolver: zodResolver(signupSchema),
        defaultValues: { email: '', password: '', confirmPassword: '' },
        mode: "onChange"
    })

    const showToast = (title: string, description: string, action: "error" | "success") => {
        toast.show({
            placement: "top",
            render: ({ id }) => (
                <Toast nativeID={"toast-" + id} action={action}>
                    <View className="flex-row items-center gap-3">
                        {action === "error" ? <AlertCircle size={20} color="#dc2626" /> : <CheckCircle2 size={20} color="#16a34a" />}
                        <View>
                            <ToastTitle>{title}</ToastTitle>
                            <ToastDescription>{description}</ToastDescription>
                        </View>
                    </View>
                </Toast>
            ),
        })
    }

    const onSignup = async (data: SignupSchema) => {
        setLoading(true)
        const { error } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
        })

        if (error) {
            showToast("Signup Error", error.message, "error")
        } else {
            showToast("Account Created", "Check your email for a verification link!", "success")
            router.replace('/(auth)/signin')
        }
        setLoading(false)
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="bg-background-0"
            style={{ flex: 1 }}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6" keyboardShouldPersistTaps="handled">
                    <View className="flex-1 justify-center max-w-[400px] w-full self-center py-10">

                        <View className="mb-10 items-center">
                            <Heading size="3xl" className="text-typography-900 mb-2">Create Account</Heading>
                            <Text size="md" className="text-typography-500 text-center">Join us today</Text>
                        </View>

                        <View className="bg-background-50 p-6 rounded-3xl border border-outline-100 shadow-soft-1">
                            <View className="gap-5">

                                {/* Email Field */}
                                <View className="gap-1">
                                    <Text size="sm" className="font-medium text-typography-700 ml-1">Email Address</Text>
                                    <Controller
                                        control={control}
                                        name="email"
                                        render={({ field: { onChange, onBlur, value } }) => (
                                            <Input variant="outline" size="lg" isInvalid={!!errors.email && dirtyFields.email}>
                                                <InputSlot className="pl-4"><InputIcon as={Mail} /></InputSlot>
                                                <InputField
                                                    placeholder="juan@email.com"
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
                                    <Text size="sm" className="font-medium text-typography-700 ml-1">Password</Text>
                                    <Controller
                                        control={control}
                                        name="password"
                                        render={({ field: { onChange, onBlur, value } }) => (
                                            <Input variant="outline" size="lg" isInvalid={!!errors.password && dirtyFields.password}>
                                                <InputSlot className="pl-4"><InputIcon as={Lock} /></InputSlot>
                                                <InputField
                                                    ref={passwordRef as any}
                                                    placeholder="Create a password"
                                                    type="password"
                                                    onBlur={onBlur}
                                                    onChangeText={onChange}
                                                    value={value}
                                                    submitBehavior='submit'
                                                    returnKeyType="next"
                                                    onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                                                />
                                            </Input>
                                        )}
                                    />
                                    {errors.password && dirtyFields.password && (
                                        <Text size="xs" className="text-error-600 ml-1">{errors.password.message}</Text>
                                    )}
                                </View>

                                {/* Confirm Password Field */}
                                <View className="gap-1">
                                    <Text size="sm" className="font-medium text-typography-700 ml-1">Confirm Password</Text>
                                    <Controller
                                        control={control}
                                        name="confirmPassword"
                                        render={({ field: { onChange, onBlur, value } }) => (
                                            <Input variant="outline" size="lg" isInvalid={!!errors.confirmPassword && dirtyFields.confirmPassword}>
                                                <InputSlot className="pl-4"><InputIcon as={Lock} /></InputSlot>
                                                <InputField
                                                    ref={confirmPasswordRef as any}
                                                    placeholder="Repeat password"
                                                    type="password"
                                                    onBlur={onBlur}
                                                    onChangeText={onChange}
                                                    value={value}
                                                    onSubmitEditing={handleSubmit(onSignup)}
                                                />
                                            </Input>
                                        )}
                                    />
                                    {errors.confirmPassword && dirtyFields.confirmPassword && (
                                        <Text size="xs" className="text-error-600 ml-1">{errors.confirmPassword.message}</Text>
                                    )}
                                </View>

                                <Button
                                    size="lg"
                                    className="rounded-xl mt-2 bg-primary-600"
                                    onPress={handleSubmit(onSignup)}
                                    isDisabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator size="small" color="white" />
                                    ) : (
                                        <>
                                            <ButtonText className="font-bold">Sign Up</ButtonText>
                                            <ButtonIcon as={UserPlus} className="ml-2" />
                                        </>
                                    )}
                                </Button>
                            </View>

                            <View className="flex-row justify-center items-center gap-1 mt-8 border-t border-outline-100 pt-6">
                                <Text size="sm" className="text-typography-500">Already have an account?</Text>
                                <Button variant="link" className="p-0 h-auto" onPress={() => router.replace('/(auth)/signin')}>
                                    <ButtonText size="sm" className="text-primary-600 font-bold">Sign in</ButtonText>
                                </Button>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    )
}

export default SignupPage