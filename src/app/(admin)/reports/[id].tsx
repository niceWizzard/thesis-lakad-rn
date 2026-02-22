import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
    AlertCircle,
    CheckCircle2,
    Flag,
    MessageSquare,
    ShieldCheck,
    Star,
    User,
    XCircle
} from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Image, ScrollView } from 'react-native';

import { AlertDialog, AlertDialogBackdrop, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader } from '@/components/ui/alert-dialog';
import { Box } from '@/components/ui/box';
import { Button, ButtonSpinner, ButtonText } from '@/components/ui/button';
import { Divider } from '@/components/ui/divider';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';

import { useToastNotification } from '@/src/hooks/useToastNotification';
import { deleteReviewAndResolveReport, dismissReport, fetchReportById } from '@/src/utils/admin/reports';

const formatDate = (dateStr: string) =>
    new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(dateStr));

export default function ReportDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { showToast } = useToastNotification();

    const [confirmAction, setConfirmAction] = useState<'dismiss' | 'delete' | null>(null);

    const { data: report, isLoading, isError } = useQuery({
        queryKey: ['admin-report-detail', id],
        queryFn: () => fetchReportById(id!),
        enabled: !!id,
    });

    const { mutateAsync: dismiss, isPending: isDismissing } = useMutation({
        mutationFn: async () => {
            await dismissReport(report!.id);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
            await queryClient.invalidateQueries({ queryKey: ['admin-report-detail', id] });
            showToast({ title: 'Report Dismissed', description: 'The report has been dismissed.', action: 'info' });
            router.back();
        },
        onError: () => {
            showToast({ title: 'Error', description: 'Failed to dismiss the report.', action: 'error' });
        }
    });

    const { mutateAsync: deleteReview, isPending: isDeleting } = useMutation({
        mutationFn: async () => {
            console.log('[Delete Report] report.review_id =', report?.review_id, '| report.id =', report?.id);
            if (report?.review_id == null) {
                throw new Error('Missing review_id — cannot delete review.');
            }
            await deleteReviewAndResolveReport(report.review_id, report.id, report.review_images ?? []);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
            showToast({ title: 'Review Deleted', description: 'The review has been removed and the report resolved.', action: 'success' });
            router.back();
        },
        onError: () => {
            showToast({ title: 'Error', description: 'Failed to delete review.', action: 'error' });
        }
    });

    const handleConfirm = async () => {
        setConfirmAction(null);
        if (confirmAction === 'dismiss') await dismiss();
        if (confirmAction === 'delete') await deleteReview();
    };

    const isPending = report?.status === 'PENDING';
    const isActing = isDismissing || isDeleting;

    const StatusBadge = () => {
        if (!report) return null;
        const map = {
            PENDING: { icon: AlertCircle, label: 'Pending', color: 'text-warning-600', bg: 'bg-warning-50' },
            ACTION_TAKEN: { icon: CheckCircle2, label: 'Action Taken', color: 'text-success-600', bg: 'bg-success-50' },
            DISMISSED: { icon: XCircle, label: 'Dismissed', color: 'text-typography-500', bg: 'bg-background-100' },
        };
        const s = map[report.status as keyof typeof map];
        if (!s) return null;
        return (
            <HStack className={`${s.bg} px-3 py-1.5 rounded-full items-center`} space="xs">
                <Icon as={s.icon} size="sm" className={s.color} />
                <Text size="sm" className={`font-bold ${s.color}`}>{s.label}</Text>
            </HStack>
        );
    };

    if (isLoading) return (
        <Box className="flex-1 bg-background-50 justify-center items-center">
            <Stack.Screen options={{ title: 'Report Detail' }} />
            <ActivityIndicator size="large" />
        </Box>
    );

    if (isError || !report) return (
        <Box className="flex-1 bg-background-50 justify-center items-center p-8">
            <Stack.Screen options={{ title: 'Report Detail' }} />
            <Text className="text-error-500 text-center text-lg font-medium">Failed to load report.</Text>
        </Box>
    );

    return (
        <Box className="flex-1 bg-background-50">
            <Stack.Screen
                options={{
                    headerTitle: `Report #${id}`,
                }}
            />
            <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
                <VStack space="lg">

                    {/* Header: Status + Date */}
                    <HStack className="justify-between items-center">
                        <StatusBadge />
                        <Text size="sm" className="text-typography-400">{formatDate(report.created_at)}</Text>
                    </HStack>

                    {/* Report Info Card */}
                    <Box className="bg-background-0 rounded-3xl p-5 border border-outline-100 shadow-soft-1">
                        <VStack space="md">
                            <HStack className="items-center" space="sm">
                                <Box className="bg-error-50 p-2.5 rounded-xl">
                                    <Icon as={Flag} size="md" className="text-error-500" />
                                </Box>
                                <VStack>
                                    <Text size="xs" className="text-typography-400 uppercase font-bold tracking-wider">Report Reason</Text>
                                    <Text size="lg" className="font-bold text-typography-900">{report.reason}</Text>
                                </VStack>
                            </HStack>

                            {report.details ? (
                                <>
                                    <Divider />
                                    <VStack space="xs">
                                        <Text size="xs" className="text-typography-400 uppercase font-bold tracking-wider">Details</Text>
                                        <Text size="md" className="text-typography-700 leading-relaxed">{report.details}</Text>
                                    </VStack>
                                </>
                            ) : null}

                            <Divider />

                        </VStack>
                    </Box>

                    {/* Reported Review Card */}
                    <Box className="bg-background-0 rounded-3xl p-5 border border-outline-100 shadow-soft-1">
                        <VStack space="md">
                            <HStack className="items-center" space="sm">
                                <Box className="bg-secondary-50 p-2.5 rounded-xl">
                                    <Icon as={MessageSquare} size="md" className="text-secondary-500" />
                                </Box>
                                <VStack>
                                    <Text size="xs" className="text-typography-400 uppercase font-bold tracking-wider">Reported Review</Text>
                                    {report.place_name && (
                                        <Text size="sm" className="text-typography-600 font-medium">{report.place_name}</Text>
                                    )}
                                </VStack>
                            </HStack>

                            {/* Star Rating */}
                            <HStack className="items-center" space="xs">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <Icon
                                        key={s}
                                        as={Star}
                                        size="sm"
                                        className={s <= report.review_rating ? "text-warning-400 fill-warning-400" : "text-outline-200"}
                                    />
                                ))}
                                <Text size="sm" className="text-typography-500 ml-1 font-semibold">{report.review_rating}/5</Text>
                            </HStack>

                            {/* Review Content */}
                            {report.review_content ? (
                                <Box className="bg-background-50 p-4 rounded-2xl border border-outline-100">
                                    <Text size="md" className="text-typography-700 leading-relaxed">{report.review_content}</Text>
                                </Box>
                            ) : (
                                <Text size="sm" className="text-typography-400 italic">No text in this review.</Text>
                            )}

                            {/* Author */}
                            <HStack className="items-center" space="sm">
                                <Icon as={User} size="sm" className="text-typography-400" />
                                <Text size="sm" className="text-typography-500">
                                    Author: <Text className="font-semibold text-typography-800">{report.reviewer_name ?? 'Unknown'}</Text>
                                </Text>
                            </HStack>

                            {/* Images */}
                            {report.review_images && report.review_images.length > 0 && (
                                <VStack space="sm">
                                    <Text size="xs" className="text-typography-400 uppercase font-bold tracking-wider">
                                        Photos ({report.review_images.length})
                                    </Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        <HStack space="sm">
                                            {report.review_images.map((uri: string, i: number) => (
                                                <Image
                                                    key={i}
                                                    source={{ uri }}
                                                    style={{ width: 220, height: 160, borderRadius: 16 }}
                                                    resizeMode="cover"
                                                />
                                            ))}
                                        </HStack>
                                    </ScrollView>
                                </VStack>
                            )}
                        </VStack>
                    </Box>

                    {/* Action Buttons - only visible for pending reports */}
                    {isPending && (
                        <VStack space="md" className="mt-2">
                            <Button
                                size="lg"
                                variant="outline"
                                action="secondary"
                                className="rounded-2xl border-outline-200"
                                onPress={() => setConfirmAction('dismiss')}
                                isDisabled={isActing}
                            >
                                <HStack className="items-center" space="sm">
                                    <Icon as={ShieldCheck} size="md" className="text-typography-500" />
                                    <ButtonText className="font-semibold text-typography-700">Dismiss Report</ButtonText>
                                </HStack>
                            </Button>

                            <Button
                                size="lg"
                                action="negative"
                                className="rounded-2xl bg-error-600"
                                onPress={() => setConfirmAction('delete')}
                                isDisabled={isActing}
                            >
                                {isActing && <ButtonSpinner color="white" />}
                                <HStack className="items-center" space="sm">
                                    <Icon as={XCircle} size="md" className="text-white" />
                                    <ButtonText className="font-semibold text-white">Delete Review</ButtonText>
                                </HStack>
                            </Button>
                        </VStack>
                    )}

                    {!isPending && (
                        <Box className="p-4 bg-success-50 rounded-2xl border border-success-100">
                            <HStack className="items-center" space="sm">
                                <Icon as={CheckCircle2} size="md" className="text-success-600" />
                                <Text size="sm" className="text-success-700 font-semibold">
                                    This report has been resolved.
                                </Text>
                            </HStack>
                        </Box>
                    )}

                </VStack>
            </ScrollView>

            {/* Confirmation Dialog */}
            <AlertDialog
                isOpen={!!confirmAction}
                onClose={() => setConfirmAction(null)}
            >
                <AlertDialogBackdrop />
                <AlertDialogContent className="rounded-3xl p-2">
                    <AlertDialogHeader className="px-5 pt-5 pb-2">
                        <Heading size="xl" className="font-bold text-typography-950">
                            {confirmAction === 'delete' ? 'Delete Review?' : 'Dismiss Report?'}
                        </Heading>
                    </AlertDialogHeader>
                    <AlertDialogBody className="px-5 pb-5">
                        <Text size="sm" className="text-typography-500 leading-snug">
                            {confirmAction === 'delete'
                                ? 'This will permanently delete the review and mark this report as resolved. This action cannot be undone.'
                                : 'This will mark the report as dismissed without removing the review.'}
                        </Text>
                    </AlertDialogBody>
                    <AlertDialogFooter className="px-5 pb-5 pt-0">
                        <Button
                            variant="outline"
                            action="secondary"
                            onPress={() => setConfirmAction(null)}
                            size="md"
                            className="rounded-xl flex-1 mr-3 border-outline-200"
                        >
                            <ButtonText className="text-typography-600 font-medium">Cancel</ButtonText>
                        </Button>
                        <Button
                            size="md"
                            action={confirmAction === 'delete' ? 'negative' : 'primary'}
                            onPress={handleConfirm}
                            className={`rounded-xl flex-1 ${confirmAction === 'delete' ? 'bg-error-600' : 'bg-primary-600'}`}
                        >
                            <ButtonText className="font-semibold text-white">
                                {confirmAction === 'delete' ? 'Delete' : 'Dismiss'}
                            </ButtonText>
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Box>
    );
}
