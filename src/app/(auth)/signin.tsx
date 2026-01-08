import { Button, ButtonText } from '@/components/ui/button'
import { Input, InputField } from '@/components/ui/input'
import { Text } from '@/components/ui/text'
import { supabase } from '@/src/utils/supabase'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { Alert, View, } from 'react-native'

const SigninPage = () => {

    const router = useRouter();

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')


    async function onSubmit() {
        const {
            data: { session },
            error,
        } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        })

        if (session) {
            router.replace('/(tabs)')
        }
        if (error)
            Alert.alert("Some error: ", error.message)
    }


    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16, }}>
            <View className='border-secondary-600 p-4 rounded-md border w-full gap-2' >
                <Text size='2xl' className='text-center mb-8'>Continue with your account</Text>
                <View className='gap-2 mb-4'>
                    <Text>Email</Text>
                    <Input
                        variant="outline"
                        size="md"
                    >
                        <InputField placeholder="juan@email.com" value={email} onChangeText={setEmail} />
                    </Input>
                    <Text>Password</Text>
                    <Input
                        variant="outline"
                        size="md"
                    >
                        <InputField placeholder="Your password..." type='password' value={password} onChangeText={setPassword} />
                    </Input>
                </View>

                <Button variant='link'
                    onPress={() => {
                        router.navigate('/(auth)/forgot')
                    }}
                >
                    <ButtonText className='text-end'>Forgot password?</ButtonText>
                </Button>

                <Button action='primary'
                    onPress={onSubmit}
                >
                    <ButtonText>Sign in</ButtonText>
                </Button>

                <View className='flex-row justify-center items-center gap-2 mt-4'>
                    <Text>
                        Don't have an account?
                    </Text>
                    <Button variant='link'
                        onPress={() => {
                            router.replace('/(auth)/signup')
                        }}
                    >
                        <ButtonText>Sign up</ButtonText>
                    </Button>
                </View>
            </View>
        </View>
    )
}

export default SigninPage