import { Button, ButtonText } from '@/components/ui/button'
import { Input, InputField } from '@/components/ui/input'
import { Text } from '@/components/ui/text'
import { useAuthStore } from '@/src/stores/useAuth'
import { supabase } from '@/src/utils/supabase'
import * as Linking from 'expo-linking'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, View } from 'react-native'


const ResetPasswordHandler = () => {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const linkUrl = Linking.useLinkingURL();

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const { session } = useAuthStore()

    async function resetPassword() {
        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        try {
            const { data, error } = await supabase.auth.updateUser({
                password: password
            })
            if (error) {
                Alert.alert(error.message)
                console.error(error)
                return;
            }
            Alert.alert("Password reset successfully")
            router.replace('/')

        } catch (err) {
            const error = err as Error
            Alert.alert(error.message)
            console.error(err)
        }
    }

    useEffect(() => {
        const handleDeepLink = async () => {
            try {
                if (!session) {
                    if (!linkUrl)
                        return;
                    const { queryParams } = Linking.parse(linkUrl.replace("#", '?'))
                    if (!queryParams) {
                        setError("Invalid query parameters")
                        return;
                    }

                    const access_token = queryParams.access_token?.toString()
                    const refresh_token = queryParams.refresh_token?.toString()

                    if (!access_token || !refresh_token) {
                        setError('Invalid query parameters')
                        return
                    }

                    const { error: sessionError } = await supabase.auth.setSession({
                        access_token,
                        refresh_token
                    })

                    if (sessionError) {
                        setError(sessionError.message)
                        return
                    }
                }

                // Verify we have a valid session
                const { data: { session: currentSession } } = await supabase.auth.getSession()

                if (!currentSession) {
                    setError('Session could not be established')
                    return
                }
            } catch (err: any) {
                setError(err.message || 'An error occurred')
            } finally {
                setLoading(false)
            }
        }

        handleDeepLink()
    }, [router])

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
                <Text className="mt-4">Verifying reset link...</Text>
            </View>
        )
    }

    if (error) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                <Text className="text-red-500 text-center mb-4">Error: {error}</Text>
                <Text className="text-center mb-4">The reset link may be invalid or expired.</Text>
                <Button
                    onPress={() => router.replace('/(auth)/forgot')}
                    action="primary"
                >
                    <ButtonText>Request New Link</ButtonText>
                </Button>
            </View>
        )
    }

    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16, }}>
        <View className='border-secondary-600 p-4 rounded-md border w-full gap-2' >
            <Text size='2xl' className='text-center mb-8'>Reset your password</Text>
            <View className='gap-2 mb-4'>
                <Text>Password</Text>
                <Input
                    variant="outline"
                    size="md"
                >
                    <InputField placeholder="Your password..." type='password' value={password} onChangeText={setPassword} />
                </Input>
                <Text>Confirm Password</Text>
                <Input
                    variant="outline"
                    size="md"
                >
                    <InputField placeholder="Confirm your password..." type='password' value={confirmPassword} onChangeText={setConfirmPassword} />
                </Input>
            </View>

            <Button action='primary'
                onPress={resetPassword}
            >
                <ButtonText>Reset password</ButtonText>
            </Button>
        </View>
    </View>
}

export default ResetPasswordHandler