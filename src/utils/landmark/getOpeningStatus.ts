import { OpeningHours } from "@/src/model/hours.types";
import { addMinute, format, isAfter, isBefore, parse } from "@formkit/tempo";

type OpeningStatus = {
    status: 'Open' | 'Closed' | 'Closing Soon' | 'Opening Soon';
    label: string;
    color: 'success' | 'error' | 'warning' | 'info';
    time?: Date;
    nextOpen?: Date;
    closesAt?: Date;
};

export const getOpeningStatus = (hours: OpeningHours[]): OpeningStatus => {
    const now = new Date();
    // 0 is Sunday in Tempo, 1 is Monday.
    const currentDay = now.getDay();
    const todayHours = hours.find(h => h.day_of_week === currentDay);

    if (!todayHours || todayHours.is_closed || !todayHours.opens_at || !todayHours.closes_at) {
        for (let i = 1; i <= 7; i++) {
            const nextDayIndex = (currentDay + i) % 7;
            const nextDayHours = hours.find(h => h.day_of_week === nextDayIndex);
            if (nextDayHours && !nextDayHours.is_closed && nextDayHours.opens_at) {
                const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                return {
                    status: 'Closed',
                    label: `Opens ${days[nextDayIndex]}`,
                    color: 'error',
                };
            }
        }
        return {
            status: 'Closed',
            label: 'Closed',
            color: 'error',
        };
    }

    const { opens_at, closes_at } = todayHours;

    // If opens_at is "08:00:00", format is "HH:mm:ss".
    const openTime = parse(`${format(now, "YYYY-MM-DD")} ${opens_at}`, "YYYY-MM-DD HH:mm:ss");
    const closeTime = parse(`${format(now, "YYYY-MM-DD")} ${closes_at}`, "YYYY-MM-DD HH:mm:ss");

    if (isBefore(now, openTime)) {
        if (isBefore(now, addMinute(openTime, -60))) {
            return {
                status: 'Closed',
                label: `Opens ${format(openTime, "h:mm A")}`,
                color: 'error',
                nextOpen: openTime
            }
        } else {
            return {
                status: 'Opening Soon',
                label: `Opens ${format(openTime, "h:mm A")}`,
                color: 'warning',
                nextOpen: openTime
            }
        }
    }

    if (isAfter(now, closeTime)) {
        return {
            status: 'Closed',
            label: 'Closed for the day',
            color: 'error',
        };
    }

    // It overlaps. Check if closing soon (within 60 mins)
    if (isAfter(now, addMinute(closeTime, -60))) {
        return {
            status: 'Closing Soon',
            label: `Closes ${format(closeTime, "h:mm A")}`,
            color: 'warning',
            closesAt: closeTime
        };
    }

    return {
        status: 'Open',
        label: `Open until ${format(closeTime, "h:mm A")}`,
        color: 'success',
        closesAt: closeTime
    };
};

export const formatTime = (timeString: string | null) => {
    if (!timeString) return "";
    // Robust parsing, try full date-time context or just assume today
    // Since input is just HH:mm:ss, best to create a dummy date for formatting
    try {
        const date = parse(`2000-01-01 ${timeString}`, "YYYY-MM-DD HH:mm:ss");
        return format(date, "h:mm A");
    } catch (e) {
        return timeString; // Fallback
    }
}
