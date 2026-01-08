import { supabase } from '@/src/utils/supabase'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, View } from 'react-native'
import * as z from 'zod'

import { Button, ButtonIcon, ButtonText } from '@/components/ui/button'
import { Heading } from '@/components/ui/heading'
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input'
import { Text } from '@/components/ui/text'
import { Toast, ToastDescription, ToastTitle, useToast } from '@/components/ui/toast'
import { Lock, LogIn, Mail } from 'lucide-react-native'

// Validation Schema
const signinSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(1, "Password is required"),
})

type SigninSchema = z.infer<typeof signinSchema>

const SigninPage = () => {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const toast = useToast();

    const {
        control,
        handleSubmit,
        formState: { errors, dirtyFields }
    } = useForm<SigninSchema>({
        resolver: zodResolver(signinSchema),
        defaultValues: {
            email: '',
            password: '',
        },
        mode: "onChange"
    })

    const onSignin = async (data: SigninSchema) => {
        setLoading(true);
        try {
            const { data: { session }, error } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            });

            if (error) throw error; // Jump to catch block if Supabase returns an error

            if (session) {
                router.replace('/(tabs)');
            }
        } catch (error: any) {
            // 2. Trigger the Toast instead of Alert
            toast.show({
                placement: "top",
                render: ({ id }) => {
                    const toastId = "toast-" + id;
                    return (
                        <Toast nativeID={toastId} action="error" variant="solid" className="mt-10">
                            <View className="flex-column">
                                <ToastTitle className="font-bold">Login Failed</ToastTitle>
                                <ToastDescription>
                                    {error.message || "Please check your credentials and try again."}
                                </ToastDescription>
                            </View>
                        </Toast>
                    );
                },
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className=" bg-background-0"
            // flex-1 does not work with keyboard avoid
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
                            <Heading size="3xl" className="text-typography-900 mb-2">Welcome Back</Heading>
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
                                            <Input
                                                variant="outline"
                                                size="lg"
                                                className="rounded-xl"
                                                isInvalid={!!errors.email && dirtyFields.email}
                                            >
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
                                            <Input
                                                variant="outline"
                                                size="lg"
                                                className="rounded-xl"
                                                isInvalid={!!errors.password && dirtyFields.password}
                                            >
                                                <InputSlot className="pl-4">
                                                    <InputIcon as={Lock} className="text-typography-400" />
                                                </InputSlot>
                                                <InputField
                                                    placeholder="Enter password"
                                                    type="password"
                                                    onBlur={onBlur}
                                                    onChangeText={onChange}
                                                    value={value}
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
                                    isDisabled={loading}
                                >
                                    <ButtonText className="font-bold">{loading ? "Signing in..." : "Sign In"}</ButtonText>
                                    <ButtonIcon as={LogIn} className="ml-2" />
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