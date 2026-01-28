import { Toast, ToastDescription, ToastTitle, useToast } from '@/components/ui/toast';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react-native';
import { View } from 'react-native';

export const useToastNotification = () => {
    const toast = useToast()

    const showToast = ({ title, description, action = "success" }: { title: string, description?: string, action?: "error" | "success" | 'info' }) => {
        // Define icon and color based on action type
        const getIconConfig = () => {
            switch (action) {
                case 'error':
                    return { Icon: AlertCircle };
                case 'success':
                    return { Icon: CheckCircle2 };
                case 'info':
                    return { Icon: Info };
                default:
                    return { Icon: CheckCircle2 };
            }
        };

        const { Icon } = getIconConfig();

        toast.show({
            placement: "bottom",
            duration: 2000,
            render: ({ id }) => {
                const toastId = "toast-" + id
                return (
                    <Toast
                        nativeID={toastId}
                        action={action}
                        className="mb-2 rounded-2xl shadow-lg min-w-[280px]"
                    >
                        <View className="flex-row items-start gap-3 p-1">
                            {/* Icon container with background */}
                            <View
                                className="rounded-full p-2 items-center justify-center flex-shrink-0"
                            >
                                <Icon size={20} strokeWidth={2.5} />
                            </View>

                            {/* Content */}
                            <View className="flex-1 flex-shrink pr-2">
                                <ToastTitle className="text-base font-semibold mb-0.5">
                                    {title}
                                </ToastTitle>
                                {description && (
                                    <ToastDescription className="text-sm opacity-90">
                                        {description}
                                    </ToastDescription>
                                )}
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