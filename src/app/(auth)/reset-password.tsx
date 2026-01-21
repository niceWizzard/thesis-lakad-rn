import { useAuthStore } from '@/src/stores/useAuth'
import { supabase } from '@/src/utils/supabase'
import { zodResolver } from '@hookform/resolvers/zod'
import * as Linking from 'expo-linking'
import { useRouter } from 'expo-router'
import React, { useEffect, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, ScrollView, TextInput, TouchableWithoutFeedback, View } from 'react-native'
import * as z from 'zod'

import { Button, ButtonIcon, ButtonText } from '@/components/ui/button'
import { Heading } from '@/components/ui/heading'
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input'
import { Text } from '@/components/ui/text'
import { useToastNotification } from '@/src/hooks/useToastNotification'
import { AlertCircle, Lock, RefreshCw } from 'lucide-react-native'

// 1. Validation Schema
const resetPasswordSchema = z.object({
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Include at least one uppercase letter")
        .regex(/[0-9]/, "Include at least one number"),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})

type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>

const ResetPasswordHandler = () => {
    const router = useRouter()
    const { showToast } = useToastNotification()
    const [verifying, setVerifying] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const linkUrl = Linking.useLinkingURL()
    const { session } = useAuthStore()

    const confirmPasswordRef = useRef<TextInput>(null);

    const { control, handleSubmit, formState: { errors, dirtyFields } } = useForm<ResetPasswordSchema>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: { password: '', confirmPassword: '' },
        mode: "onChange"
    })

    useEffect(() => {
        const handleDeepLink = async () => {
            if (session) {
                setVerifying(false)
                return
            }

            try {
                if (!linkUrl) return

                const { queryParams } = Linking.parse(linkUrl.replace("#", '?'))
                const access_token = queryParams?.access_token?.toString()
                const refresh_token = queryParams?.refresh_token?.toString()

                if (!access_token || !refresh_token) {
                    setError("The reset link is missing required security tokens.")
                    return
                }
                const { error: sessionError } = await supabase.auth.setSession({
                    access_token,
                    refresh_token
                })

                if (sessionError) throw sessionError

            } catch (err: any) {
                setError(err.message || 'Verification failed')
                showToast({
                    title: "Link Error",
                    description: err.message || "Failed to verify reset link",
                    action: 'error',
                })
            } finally {
                setVerifying(false)
            }
        }
        handleDeepLink()
    }, [linkUrl])

    const onReset = async (data: ResetPasswordSchema) => {
        setSubmitting(true)
        try {
            const { error } = await supabase.auth.updateUser({
                password: data.password
            })
            if (error) throw error

            showToast({
                title: "Success",
                description: "Your password has been updated.",
            })

            router.replace('/(auth)/signin')
        } catch (err: any) {
            showToast({
                title: "Error",
                description: err.message ?? "Something went wrong. Please try again.",
            })
        } finally {
            setSubmitting(false)
        }
    }

    if (verifying) {
        return (
            <View className="flex-1 justify-center items-center bg-background-0 p-6">
                <ActivityIndicator size="large" color="#4f46e5" />
                <Text size="md" className="mt-4 text-typography-500 font-medium">Securing session...</Text>
            </View>
        )
    }

    if (error) {
        return (
            <View className="flex-1 justify-center items-center bg-background-0 p-6">
                <View className="bg-error-50 p-6 rounded-3xl items-center border border-error-100 w-full max-w-md">
                    <AlertCircle size={48} color="#ef4444" />
                    <Heading size="xl" className="text-typography-900 mt-4 mb-2">Link Invalid</Heading>
                    <Text className="text-center text-typography-600 mb-6">{error}</Text>
                    <Button
                        className="w-full rounded-xl"
                        onPress={() => router.replace('/(auth)/forgot')}
                    >
                        <ButtonText>Request New Link</ButtonText>
                    </Button>
                </View>
            </View>
        )
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

                        <View className="mb-8 items-center">
                            <Heading size="3xl" className="text-typography-900 mb-2">New Password</Heading>
                            <Text size="md" className="text-typography-500 text-center">Set a secure password for your account</Text>
                        </View>

                        <View className="bg-background-50 p-6 rounded-3xl border border-outline-100 shadow-soft-1">
                            <View className="gap-5">

                                {/* New Password */}
                                <View className="gap-1">
                                    <Text size="sm" className="font-medium text-typography-700 ml-1">New Password</Text>
                                    <Controller
                                        control={control}
                                        name="password"
                                        render={({ field: { onChange, onBlur, value } }) => (
                                            <Input variant="outline" size="lg" isInvalid={!!errors.password && dirtyFields.password}>
                                                <InputSlot className="pl-4"><InputIcon as={Lock} /></InputSlot>
                                                <InputField
                                                    placeholder="Enter new password"
                                                    type="password"
                                                    onBlur={onBlur}
                                                    onChangeText={onChange}
                                                    autoCapitalize='none'
                                                    value={value}
                                                    returnKeyType='next'
                                                    onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                                                />
                                            </Input>
                                        )}
                                    />
                                    {errors.password && dirtyFields.password && (
                                        <Text size="xs" className="text-error-600 ml-1">{errors.password.message}</Text>
                                    )}
                                </View>

                                {/* Confirm Password */}
                                <View className="gap-1">
                                    <Text size="sm" className="font-medium text-typography-700 ml-1">Confirm New Password</Text>
                                    <Controller
                                        control={control}
                                        name="confirmPassword"
                                        render={({ field: { onChange, onBlur, value } }) => (
                                            <Input variant="outline" size="lg" isInvalid={!!errors.confirmPassword && dirtyFields.confirmPassword}>
                                                <InputSlot className="pl-4"><InputIcon as={Lock} /></InputSlot>
                                                <InputField
                                                    ref={confirmPasswordRef as any}
                                                    placeholder="Repeat new password"
                                                    autoCapitalize='none'
                                                    type="password"
                                                    onBlur={onBlur}
                                                    onChangeText={onChange}
                                                    onSubmitEditing={handleSubmit(onReset)}
                                                    value={value}
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
                                    onPress={handleSubmit(onReset)}
                                    isDisabled={submitting}
                                >
                                    {submitting ? (
                                        <ActivityIndicator size="small" color="white" />
                                    ) : (
                                        <>
                                            <ButtonText className="font-bold">Update Password</ButtonText>
                                            <ButtonIcon as={RefreshCw} className="ml-2" />
                                        </>
                                    )}
                                </Button>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    )
}

export default ResetPasswordHandler