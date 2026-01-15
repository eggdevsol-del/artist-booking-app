import { PageSchema } from "./types";
import { nanoid } from "nanoid";

export const STARTER_SCHEMA: PageSchema = {
    id: "calendar-starter",
    name: "My Calendar",
    meta: { title: "Calendar Overview" },
    sections: [
        {
            id: nanoid(),
            type: "section",
            blocks: [
                {
                    id: nanoid(),
                    registryKey: "sectionHeader",
                    props: { title: "Calendar", showAction: true, actionLabel: "Today" }
                },
                {
                    id: nanoid(),
                    registryKey: "monthHeader",
                    props: { label: "September 2024" }
                },
                {
                    id: nanoid(),
                    registryKey: "segmentedControl",
                    props: { options: ["Week", "Month"], activeIndex: 0 }
                },
                {
                    id: nanoid(),
                    registryKey: "spacer",
                    props: { size: "sm" }
                },
                {
                    id: nanoid(),
                    registryKey: "dayCard",
                    props: { weekday: "Monday", dayNumber: "23", isToday: false, appointmentsCount: 0 }
                },
                {
                    id: nanoid(),
                    registryKey: "dayCard",
                    props: { weekday: "Tuesday", dayNumber: "24", isToday: true, appointmentsCount: 1 },
                    children: [
                        {
                            id: nanoid(),
                            registryKey: "appointmentCard",
                            props: { title: "Tattoo Session", clientName: "John Doe", time: "09:00 - 10:00", price: "150" }
                        }
                    ]
                },
                {
                    id: nanoid(),
                    registryKey: "dayCard",
                    props: { weekday: "Wednesday", dayNumber: "25", isToday: false, appointmentsCount: 1 },
                    children: [
                        {
                            id: nanoid(),
                            registryKey: "appointmentCard",
                            props: { title: "Consultation", clientName: "Jane Smith", time: "11:30 - 12:00", price: "50" }
                        }
                    ]
                }
            ]
        }
    ]
};
