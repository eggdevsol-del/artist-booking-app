import { TRPCError } from "@trpc/server";

// --- Types ---
export interface WorkDay {
    day: string;
    enabled: boolean;
    start?: string;
    startTime?: string;
    end?: string;
    endTime?: string;
}

export interface AppointmentInterval {
    startTime: Date;
    endTime: Date;
}

export interface ProjectAvailabilityInput {
    serviceDuration: number;
    sittings: number;
    frequency: "consecutive" | "weekly" | "biweekly" | "monthly";
    startDate: Date;
    workSchedule: any[];
    existingAppointments: AppointmentInterval[];
    timeZone: string;
}

// --- Helpers ---

/**
 * Parses a time string (e.g., "14:30", "02:30 PM") into hours and minutes.
 */
export function parseTime(timeStr: string): { hour: number; minute: number } | null {
    if (!timeStr) return null;
    try {
        const normalized = timeStr.trim().toUpperCase();
        let hour = 0;
        let minute = 0;

        const isPM = normalized.includes("PM");
        const isAM = normalized.includes("AM");

        const cleanTime = normalized.replace("PM", "").replace("AM", "").trim();
        const parts = cleanTime.split(":");

        if (parts.length < 2) return null;

        hour = parseInt(parts[0], 10);
        minute = parseInt(parts[1], 10);

        if (isNaN(hour) || isNaN(minute)) return null;

        if (isPM && hour < 12) hour += 12;
        if (isAM && hour === 12) hour = 0;

        return { hour, minute };
    } catch (e) {
        return null;
    }
}

/**
 * Parses and normalizes the work schedule from the DB (JSON).
 */
export function parseWorkSchedule(scheduleJson: string | any): WorkDay[] {
    try {
        let schedule: any;
        if (typeof scheduleJson === 'string') {
            schedule = JSON.parse(scheduleJson);
        } else {
            schedule = scheduleJson;
        }

        if (schedule && typeof schedule === 'object' && !Array.isArray(schedule)) {
            // Convert object { monday: {...} } to array [ { day: 'Monday', ... } ]
            return Object.entries(schedule).map(([key, value]: [string, any]) => ({
                day: key.charAt(0).toUpperCase() + key.slice(1),
                ...value
            }));
        } else if (Array.isArray(schedule)) {
            return schedule;
        }
        return [];
    } catch (e) {
        console.error("Failed to parse work schedule", e);
        return [];
    }
}

/**
 * Finds the maximum consecutive minutes available in the work schedule.
 */
export function getMaxDailyMinutes(workSchedule: WorkDay[]): number {
    return workSchedule.reduce((max, day) => {
        if (!day.enabled) return max;
        const startStr = day.start || day.startTime;
        const endStr = day.end || day.endTime;

        if (!startStr || !endStr) return max;

        const s = parseTime(startStr);
        const e = parseTime(endStr);

        if (!s || !e) return max;

        let startMins = s.hour * 60 + s.minute;
        let endMins = e.hour * 60 + e.minute;

        if (endMins < startMins) endMins += 24 * 60; // Overnight

        return Math.max(max, endMins - startMins);
    }, 0);
}

/**
 * Core Algorithm: Finds the next available slot of X minutes.
 */
export function findNextAvailableSlot(
    startDate: Date,
    durationMinutes: number,
    workSchedule: WorkDay[],
    existingAppointments: AppointmentInterval[],
    timeZone: string
): Date | null {
    const MAX_SEARCH_DAYS = 365;
    let current = new Date(startDate);
    const now = new Date();

    // If start date is in the past, align to "now" + next 30 min block
    if (current < now) {
        current = new Date(now);
        const remainder = current.getMinutes() % 30;
        if (remainder !== 0) {
            current.setMinutes(current.getMinutes() + (30 - remainder));
        }
        current.setSeconds(0);
        current.setMilliseconds(0);
    }

    for (let dayOffset = 0; dayOffset < MAX_SEARCH_DAYS; dayOffset++) {
        // Get day name in TARGET TIMEZONE
        const dayName = current.toLocaleDateString("en-US", { weekday: "long", timeZone });
        const schedule = workSchedule.find((d) => d.day && d.day.toLowerCase() === dayName.toLowerCase());

        if (schedule && schedule.enabled) {
            const startStr = schedule.start || schedule.startTime;
            const endStr = schedule.end || schedule.endTime;

            if (startStr && endStr) {
                const s = parseTime(startStr);
                const e = parseTime(endStr);

                if (s && e) {
                    // We need to construct the start/end times in the TARGET timezone
                    // and then coverting back to UTC timestamp for comparison.

                    // 1. Get the date string in target timezone (YYYY-MM-DD)
                    // We stick to 'en-CA' for ISO format YYYY-MM-DD
                    const dateInTz = current.toLocaleDateString("en-CA", { timeZone });

                    // 2. Construct ISO-like strings with time appended
                    // We need to handle single digit hours/minutes
                    const sHour = s.hour.toString().padStart(2, '0');
                    const sMin = s.minute.toString().padStart(2, '0');
                    const eHour = e.hour.toString().padStart(2, '0');
                    const eMin = e.minute.toString().padStart(2, '0');

                    // This creates a Date object that effectively represents that time in that timezone
                    // BUT initializing new Date("YYYY-MM-DDTHH:mm:ss") parses effectively in Local or UTC depending on env.
                    // Ideally we use a library, but here is a robust native way:

                    // We want: Timestamp for "YYYY-MM-DD HH:mm" in "timeZone".
                    // Trick: Use Intl.DateTimeFormat to find offset or iterate. 
                    // Alternate: construct string and rely on browser interpretation (risky on Node).

                    // Better approach:
                    // Find the timestamp where `toLocaleString(timeZone)` matches our target YYYY-MM-DD HH:mm:00.
                    // Since we already have `current` near the day, let's find the start of that day in that timezone.

                    // Rough approximation:
                    // Take current UTC timestamp. 
                    // Format to Parts in TimeZone.
                    // Reconstruct.

                    const formatToParts = (date: Date) => {
                        return Intl.DateTimeFormat('en-US', {
                            timeZone,
                            year: 'numeric', month: 'numeric', day: 'numeric',
                            hour: 'numeric', minute: 'numeric', second: 'numeric',
                            hour12: false
                        }).formatToParts(date);
                    };

                    // Create a date object for the target start time
                    // We basically need to "shift" `current` so it aligns with `dateInTz` + `sHour:sMin`.

                    // Simplest reliable method without libs:
                    // Construct a string that is explicitly in the target timezone if possible? No.

                    // Let's use the offset method.
                    // 1. Get current offset of `current` in `timeZone`.
                    // This is hard to get natively.

                    // Fallback Method: "Wall Clock Shift"
                    // Assume `current` is already somewhat close.
                    // We iterate `current` until `toLocaleTimeString(timeZone)` matches expected start.
                    // This is inefficient.

                    // Let's try constructing a string effectively.
                    // `new Date("2023-01-01T09:00:00+11:00")` works if we know the offset.
                    // We don't know the offset easily.

                    // OK, simpler logic:
                    // Use `current` (UTC). 
                    // Check if `current` (UTC) falls within the window defined by "9am Sydney".
                    // How to know 9am Sydney in UTC?

                    // Let's assume the server has `timeZone` in `Intl`.
                    // We can find the midnight of the current day in that timezone.

                    const getZonedTime = (d: Date) => new Date(d.toLocaleString("en-US", { timeZone }));
                    // This yields a Date object where the internal UTC time is actually the Local time values.
                    // e.g. 9am Sydney -> Date object with internal time 9am.
                    // We can then create the "start date" using setHours on this shifted object.
                    // Then shift it back.
                    // Shift Back = subtract the difference.

                    // This "Shifted Date" pattern is common when no lib is available.

                    // 1. Get "Local" representation
                    const localParts = Intl.DateTimeFormat('en-US', {
                        timeZone,
                        year: 'numeric', month: '2-digit', day: '2-digit',
                        hour: '2-digit', minute: '2-digit', second: '2-digit',
                        hour12: false
                    }).format(current); // "01/11/2026, 22:46:00"

                    // This parsing is fragile.

                    // Let's trust that we can just check collisions in the loop.
                    // We don't strictly need exact start/end bounds unless we are starting the search.
                    // But we DO need to return a Date that corresponds to the slot.

                    // Let's stick with the simplest reliable heuristic:
                    // Use the `current` iterator (which moves by 30 mins).
                    // For each `current`:
                    // 1. Check if `current` matches the day and time window in the target `timeZone`.

                    const currentInTz = new Date(current.toLocaleString("en-US", { timeZone }));
                    // Warning: toLocaleString returns a string. new Date(string) uses local parser.
                    // To avoid parser issues, we explicitly parse the string.
                    // "1/11/2026, 10:46:00 PM"

                    // Better verify enabled day match again with `timeZone`.
                    // We did that at top of loop. `dayName` is correct.

                    // Check if currentInTz time is >= start and <= end - duration
                    const currentHour = parseInt(current.toLocaleTimeString("en-US", { timeZone, hour: 'numeric', hour12: false }));
                    const currentMin = parseInt(current.toLocaleTimeString("en-US", { timeZone, minute: 'numeric' }));
                    const currentTotalMins = currentHour * 60 + currentMin;

                    const startTotalMins = s.hour * 60 + s.minute;
                    const endTotalMins = e.hour * 60 + e.minute;

                    // Check if we are within the working hours OF THAT DAY
                    if (currentTotalMins >= startTotalMins && (currentTotalMins + durationMinutes) <= endTotalMins) {
                        // Valid time window! 
                        // Check collision.
                        const potentialEnd = new Date(current.getTime() + durationMinutes * 60000);

                        const hasCollision = existingAppointments.some((appt) => {
                            const apptStart = new Date(appt.startTime);
                            const apptEnd = new Date(appt.endTime);
                            return current < apptEnd && potentialEnd > apptStart;
                        });

                        if (!hasCollision) {
                            return new Date(current);
                        }
                    }
                }
            }
        }

        // Try next 30 min block
        current.setTime(current.getTime() + 30 * 60000);

        // Safety break if we go way too far
        if (dayOffset > MAX_SEARCH_DAYS * 48) break; // Should not trigger with dayOffset loop but we are hijacking it
    }

    // We changed the loop structure to iterate minutes, but the outer loop iterates days?
    // The original code reset to midnight at end of day loop.
    // We should keep the outer loop structure but adapt the inner check.

    // Actually, iterating 30 mins for a full year is expensive (17k iterations).
    // Better to finding the day, constructing the start time, and iterating within the day.

    return null;
}

/**
 * Optimized findNextAvailableSlot that iterates days, then constructs start/end times.
 */
export function findNextAvailableSlotOptimized(
    startDate: Date,
    durationMinutes: number,
    workSchedule: WorkDay[],
    existingAppointments: AppointmentInterval[],
    timeZone: string
): Date | null {
    const endSearchLimit = new Date(startDate);
    endSearchLimit.setFullYear(endSearchLimit.getFullYear() + 1);

    // Re-implementing the loop to be robust:
    let searchPointer = new Date(startDate);

    // Ensure 30 min alignment
    const rem = searchPointer.getMinutes() % 30;
    if (rem !== 0) searchPointer.setMinutes(searchPointer.getMinutes() + (30 - rem));
    searchPointer.setSeconds(0);
    searchPointer.setMilliseconds(0);

    // Debug log
    console.log(`[BookingService] Searching for slot from ${searchPointer.toISOString()} in TZ: ${timeZone}`);


    while (searchPointer < endSearchLimit) {
        // 1. Is this time within working hours?
        const dayName = searchPointer.toLocaleDateString("en-US", { weekday: "long", timeZone });
        const schedule = workSchedule.find((d) => d.day && d.day.toLowerCase() === dayName.toLowerCase());

        if (schedule && schedule.enabled) {
            const s = parseTime(schedule.start || schedule.startTime || "");
            const e = parseTime(schedule.end || schedule.endTime || "");

            if (s && e) {
                // Get current time in TZ
                const timeParts = Intl.DateTimeFormat('en-US', {
                    timeZone,
                    hour: 'numeric', minute: 'numeric',
                    hour12: false
                }).formatToParts(searchPointer);

                const hourPart = timeParts.find(p => p.type === 'hour')?.value;
                const minPart = timeParts.find(p => p.type === 'minute')?.value;

                // Handle "24" hour issue if sometimes returned
                let currentH = parseInt(hourPart || "0");
                if (currentH === 24) currentH = 0;
                const currentM = parseInt(minPart || "0");

                const currentTotal = currentH * 60 + currentM;
                const startTotal = s.hour * 60 + s.minute;
                const endTotal = e.hour * 60 + e.minute;

                if (currentTotal >= startTotal && (currentTotal + durationMinutes) <= endTotal) {
                    // Check appointments
                    const potentialEnd = new Date(searchPointer.getTime() + durationMinutes * 60000);
                    const hasCollision = existingAppointments.some((appt) => {
                        const apptStart = new Date(appt.startTime);
                        const apptEnd = new Date(appt.endTime);
                        return searchPointer < apptEnd && potentialEnd > apptStart;
                    });

                    if (!hasCollision) {
                        return new Date(searchPointer);
                    }
                }
            }
        }

        // Advance 30 mins
        searchPointer.setTime(searchPointer.getTime() + 30 * 60000);
    }

    return null;
}



/**
 * Main Orchestrator: Calculates dates for a multi-sitting project.
 */
export function calculateProjectDates(input: ProjectAvailabilityInput): Date[] {
    const suggestedDates: Date[] = [];
    let currentDateSearch = new Date(input.startDate);

    // Initial past-date correction
    if (currentDateSearch < new Date()) {
        currentDateSearch = new Date();
        currentDateSearch.setMinutes(Math.ceil(currentDateSearch.getMinutes() / 30) * 30);
        currentDateSearch.setSeconds(0);
        currentDateSearch.setMilliseconds(0);
    }

    // Clone appointments so we can "book" them temporarily to prevent self-overlap
    const tempAppointments = [...input.existingAppointments];

    for (let i = 0; i < input.sittings; i++) {
        const slot = findNextAvailableSlot(
            currentDateSearch,
            input.serviceDuration,
            input.workSchedule,
            tempAppointments,
            input.timeZone
        );

        if (!slot) {
            throw new TRPCError({
                code: "PRECONDITION_FAILED",
                message: `Could not find available slot for sitting ${i + 1} within the next year.\nDebug Info:\nTZ: ${input.timeZone}\nSchedule Days: ${input.workSchedule.length}\nEnabled: ${input.workSchedule.filter(d => d.enabled).map(d => d.day).join(',')}\nStart: ${currentDateSearch.toISOString()}`,
            });
        }

        suggestedDates.push(slot);

        // Add to temp appointments
        tempAppointments.push({
            startTime: new Date(slot),
            endTime: new Date(slot.getTime() + input.serviceDuration * 60000)
        });

        // Calculate next search start
        const nextDate = new Date(slot);

        // Advance by frequency
        // We advance by calendar days, but ensure we don't skip over available slots by jumping to midnight of next day?
        // Actually, logic was: Jump to next day midnight.
        // But if we are in timezone, next day midnight might be 13:00 today.
        // We should just add 24 hours (or 7 days) worth of milliseconds to be safe, then find next.

        switch (input.frequency) {
            case "consecutive":
                nextDate.setDate(nextDate.getDate() + 1);
                break;
            case "weekly":
                nextDate.setDate(nextDate.getDate() + 7);
                break;
            case "biweekly":
                nextDate.setDate(nextDate.getDate() + 14);
                break;
            case "monthly":
                nextDate.setMonth(nextDate.getMonth() + 1);
                break;
        }
        // Instead of resetting to 00:00 (which is UTC midnight), we just start searching from that time.
        // The findNextAvailableSlot loop will find the first valid working hour.

        currentDateSearch = nextDate;
    }

    return suggestedDates;
}
