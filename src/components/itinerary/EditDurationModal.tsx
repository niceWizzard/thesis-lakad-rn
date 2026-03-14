import { useTheme } from '@react-navigation/native';
import React, { useEffect } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { TimerPickerModal } from 'react-native-timer-picker';

interface EditDurationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (duration: number) => void;
    initialDuration?: number;
    stopName: string;
}

export function EditDurationModal({
    isOpen,
    onClose,
    onSave,
    initialDuration = 60,
    stopName
}: EditDurationModalProps) {

    useEffect(() => {
        // No longer need to manage internal state for durationMinutes with TimerPickerModal
    }, [initialDuration, isOpen]);

    const handleConfirm = ({ hours, minutes }: { hours: number, minutes: number }) => {
        const totalMinutes = hours * 60 + minutes;
        if (totalMinutes >= 0) {
            onSave(totalMinutes);
            onClose();
        }
    };
    const { dark } = useTheme();

    return (
        <TimerPickerModal
            visible={isOpen}
            setIsVisible={(visible) => {
                if (!visible) onClose();
            }}
            onConfirm={handleConfirm}
            modalTitle={`Edit Visit Duration`}
            onCancel={onClose}
            closeOnOverlayPress
            hideSeconds
            padWithNItems={3}
            hourLabel="h"
            minuteLabel="m"
            LinearGradient={LinearGradient}
            initialValue={{
                hours: Math.floor((initialDuration || 60) / 60),
                minutes: (initialDuration || 60) % 60,
            }}
            styles={{
                theme: dark ? "dark" : "light",
                pickerColumnWidth: 100,
            }}
        />
    );
}
