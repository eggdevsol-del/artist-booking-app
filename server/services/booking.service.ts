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
    existingAppointments: AppointmentInterval[]
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
        const dayName = current.toLocaleDateString("en-US", { weekday: "long" });
        const schedule = workSchedule.find((d) => d.day && d.day.toLowerCase() === dayName.toLowerCase());

        if (schedule && schedule.enabled) {
            const startStr = schedule.start || schedule.startTime;
            const endStr = schedule.end || schedule.endTime;

            if (startStr && endStr) {
                const s = parseTime(startStr);
                const e = parseTime(endStr);

                if (s && e) {
                    const dayStart = new Date(current);
                    dayStart.setHours(s.hour, s.minute, 0, 0);

                    const dayEnd = new Date(current);
                    dayEnd.setHours(e.hour, e.minute, 0, 0);

                    // If we passed the start of the work day, start from "current"
                    // Otherwise reset "current" to the start of the work day
                    if (current < dayStart) {
                        current.setTime(dayStart.getTime());
                    }

                    while (current.getTime() + durationMinutes * 60000 <= dayEnd.getTime()) {
                        const potentialEnd = new Date(current.getTime() + durationMinutes * 60000);

                        const hasCollision = existingAppointments.some((appt) => {
                            const apptStart = new Date(appt.startTime);
                            const apptEnd = new Date(appt.endTime);
                            // Strict overlap check
                            return current < apptEnd && potentialEnd > apptStart;
                        });

                        if (!hasCollision) {
                            return new Date(current);
                        }

                        // Try next 30 min block
                        current.setTime(current.getTime() + 30 * 60000);
                    }
                }
            }
        }

        // Move to next day, reset to midnight
        current.setDate(current.getDate() + 1);
        current.setHours(0, 0, 0, 0);
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
            tempAppointments
        );

        if (!slot) {
            throw new TRPCError({
                code: "PRECONDITION_FAILED",
                message: `Could not find available slot for sitting ${i + 1} within the next year.`,
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
        nextDate.setHours(0, 0, 0, 0);
        currentDateSearch = nextDate;
    }

    return suggestedDates;
}
