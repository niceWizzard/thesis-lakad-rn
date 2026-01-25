import { Toast, ToastDescription, ToastTitle, useToast } from '@/components/ui/toast';
import { AlertCircle, CheckCircle2 } from 'lucide-react-native';
import { View } from 'react-native';

export const useToastNotification = () => {
    const toast = useToast()

    const showToast = ({ title, description, action = "success" }: { title: string, description?: string, action?: "error" | "success" | 'info' }) => {
        toast.show({
            placement: "bottom",
            duration: 1500,
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
        });
    }

    return {
        ...toast,
        showToast,
    }

}