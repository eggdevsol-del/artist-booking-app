import { RegistryEntry } from "./types";
import * as Blocks from "./components/blocks";

export const COMPONENT_REGISTRY: Record<string, RegistryEntry> = {
    sectionHeader: {
        key: "sectionHeader",
        displayName: "Section Header",
        category: "content",
        supportsChildren: false,
        defaultProps: { title: "New Section", showAction: true, actionLabel: "Action" },
        render: (props) => <Blocks.SectionHeader {...props} />
    },
    monthHeader: {
        key: "monthHeader",
        displayName: "Month Header",
        category: "calendar",
        supportsChildren: false,
        defaultProps: { label: "January 2024" },
        render: (props) => <Blocks.MonthHeaderRow {...props} />
    },
    segmentedControl: {
        key: "segmentedControl",
        displayName: "View Toggle",
        category: "navigation",
        supportsChildren: false,
        defaultProps: { options: ["Week", "Month"], activeIndex: 0 },
        render: (props) => <Blocks.SegmentedControl {...props} />
    },
    dayCard: {
        key: "dayCard",
        displayName: "Day Card",
        category: "calendar",
        supportsChildren: true,
        defaultProps: { weekday: "Monday", dayNumber: "1", isToday: false, appointmentsCount: 0 },
        render: (props) => <Blocks.DayCard {...props} />
    },
    appointmentCard: {
        key: "appointmentCard",
        displayName: "Appointment",
        category: "calendar",
        supportsChildren: false,
        defaultProps: { title: "Tattoo Session", clientName: "John Doe", time: "09:00 - 10:00", price: "150" },
        render: (props) => <Blocks.AppointmentCard {...props} />
    },
    spacer: {
        key: "spacer",
        displayName: "Spacer",
        category: "layout",
        supportsChildren: false,
        defaultProps: { size: "md" },
        render: (props) => <Blocks.Spacer {...props} />
    },
    text: {
        key: "text",
        displayName: "Text Block",
        category: "content",
        supportsChildren: false,
        defaultProps: { content: "Type something...", variant: "body" },
        render: (props) => <Blocks.Text {...props} />
    }
};
