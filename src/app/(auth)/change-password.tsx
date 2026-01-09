import { useAuthStore } from '@/src/stores/useAuth'
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
import { AlertCircle, CheckCircle2, KeyRound, Lock, RefreshCw } from 'lucide-react-native'

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Include at least one uppercase letter")
        .regex(/[0-9]/, "Include at least one number"),
    confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})

type ChangePasswordSchema = z.infer<typeof changePasswordSchema>

const ChangePasswordHandler = () => {
    const router = useRouter()
    const toast = useToast()
    const [submitting, setSubmitting] = useState(false)
    const { session } = useAuthStore()

    const newPasswordRef = useRef<TextInput>(null);
    const confirmPasswordRef = useRef<TextInput>(null);

    const { control, handleSubmit, formState: { errors, dirtyFields, isValid: isFormValid }, reset } = useForm<ChangePasswordSchema>({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
        mode: "onChange"
    })

    const showToast = (title: string, description: string, action: "error" | "success") => {
        toast.show({
            placement: "top",
            duration: 1000,
            render: ({ id }) => {
                const toastId = "toast-" + id
                return (
                    <Toast nativeID={toastId} action={action}>
                        <View className="flex-row items-center gap-3">
                            {action === "error" ? <AlertCircle size={20} color="#dc2626" /> : <CheckCircle2 size={20} color="#16a34a" />}
                            <View>
                                <ToastTitle>{title}</ToastTitle>
                                <ToastDescription>{description}</ToastDescription>
                            </View>
                        </View>
                    </Toast>
                )
            },
        })
    }

    const onChangePassword = async (data: ChangePasswordSchema) => {
        setSubmitting(true)
        try {
            const email = session?.user?.email
            if (!email) throw new Error("User session not found")

            // 1. Verify Identity
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password: data.currentPassword,
            })
            if (signInError) throw new Error("Current password is incorrect")

            // 2. Update Password
            const { error: updateError } = await supabase.auth.updateUser({
                password: data.newPassword
            })
            if (updateError) throw updateError

            showToast("Success", "Your password has been updated.", "success")
            reset()
            router.back()

        } catch (err: any) {
            showToast("Update Failed", err.message || "An unexpected error occurred", "error")
        } finally {
            setSubmitting(false)
        }
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
                            <Heading size="3xl" className="text-typography-900 mb-2">Change Password</Heading>
                            <Text size="md" className="text-typography-500 text-center">Enter your current and new password below</Text>
                        </View>

                        <View className="bg-background-50 p-6 rounded-3xl border border-outline-100 shadow-soft-1">
                            <View className="gap-5">

                                {/* Current Password */}
                                <View className="gap-1">
                                    <Text size="sm" className="font-medium text-typography-700 ml-1">Current Password</Text>
                                    <Controller
                                        control={control}
                                        name="currentPassword"
                                        render={({ field: { onChange, onBlur, value } }) => (
                                            <Input variant="outline" size="lg" isInvalid={!!errors.currentPassword}>
                                                <InputSlot className="pl-4"><InputIcon as={KeyRound} /></InputSlot>
                                                <InputField
                                                    placeholder="Current password"
                                                    type="password"
                                                    autoCapitalize='none'
                                                    onBlur={onBlur}
                                                    onChangeText={onChange}
                                                    value={value}
                                                    returnKeyType="next"
                                                    onSubmitEditing={() => newPasswordRef.current?.focus()}
                                                />
                                            </Input>
                                        )}
                                    />
                                    {errors.currentPassword && (
                                        <Text size="xs" className="text-error-600 ml-1">{errors.currentPassword.message}</Text>
                                    )}
                                </View>

                                {/* New Password */}
                                <View className="gap-1">
                                    <Text size="sm" className="font-medium text-typography-700 ml-1">New Password</Text>
                                    <Controller
                                        control={control}
                                        name="newPassword"
                                        render={({ field: { onChange, onBlur, value } }) => (
                                            <Input variant="outline" size="lg" isInvalid={!!errors.newPassword && dirtyFields.newPassword}>
                                                <InputSlot className="pl-4"><InputIcon as={Lock} /></InputSlot>
                                                <InputField
                                                    ref={newPasswordRef as any}
                                                    placeholder="At least 8 characters"
                                                    type="password"
                                                    autoCapitalize='none'
                                                    onBlur={onBlur}
                                                    onChangeText={onChange}
                                                    value={value}
                                                    returnKeyType="next"
                                                    onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                                                />
                                            </Input>
                                        )}
                                    />
                                    {errors.newPassword && dirtyFields.newPassword && (
                                        <Text size="xs" className="text-error-600 ml-1">{errors.newPassword.message}</Text>
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
                                                    type="password"
                                                    autoCapitalize='none'
                                                    onBlur={onBlur}
                                                    onChangeText={onChange}
                                                    onSubmitEditing={handleSubmit(onChangePassword)}
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
                                    onPress={handleSubmit(onChangePassword)}
                                    isDisabled={!isFormValid || submitting}
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

export default ChangePasswordHandler