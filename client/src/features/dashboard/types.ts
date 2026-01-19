export type TaskDomain = 'business' | 'social' | 'personal';
export type Priority = 'high' | 'medium' | 'low';
export type ActionType = 'sms' | 'email' | 'social' | 'internal' | 'link' | 'none';

export interface DashboardTask {
    id: string;
    title: string;
    context?: string; // Subtitle
    domain: TaskDomain;
    priority: Priority;
    status: 'pending' | 'completed' | 'dismissed' | 'snoozed';
    dueDate: string; // ISO Date String

    // Action Logic
    actionType: ActionType;
    actionPayload?: string; // URL, Phone Number, Email, Route
}

export interface ChallengeTemplate {
    id: string;
    title: string;
    description: string;
    durationDays: number;
    dailyTasks: {
        title: string;
        context?: string;
        priority: Priority;
    }[];
}

export interface DashboardEvent {
    type: 'task_shown' | 'task_opened' | 'task_completed' | 'task_snoozed' | 'task_dismissed' | 'challenge_started' | 'challenge_task_completed' | 'handoff_opened';
    timestamp: number;
    meta?: any;
}
