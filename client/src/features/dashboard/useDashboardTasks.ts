import { useState, useEffect, useCallback } from 'react';
import { DashboardTask, ChallengeTemplate, TaskDomain } from './types';
import { DashboardEventLogger } from './DashboardEventLogger';
import { DashboardTaskRegister } from './DashboardTaskRegister';

const STORAGE_KEY = 'dashboard_v1_store';

interface DashboardState {
    tasks: DashboardTask[];
    socialStreak: number;
    lastVisitDate: string; // ISO Date "YYYY-MM-DD"
    activeChallengeId: string | null;
    challengeStartDate: string | null;
}

const DEFAULT_STATE: DashboardState = {
    tasks: [],
    socialStreak: 0,
    lastVisitDate: '',
    activeChallengeId: null,
    challengeStartDate: null
};

export function useDashboardTasks() {
    const [state, setState] = useState<DashboardState>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? { ...DEFAULT_STATE, ...JSON.parse(stored) } : DEFAULT_STATE;
        } catch {
            return DEFAULT_STATE;
        }
    });

    // Persistence
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, [state]);

    // Daily Rotation Logic
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];

        if (state.lastVisitDate !== today) {
            // It's a new day!
            // 1. Keep Snoozed tasks
            // 2. Clear Dismissed/Completed (Log them? Already logged on action)
            // 3. Generate New Defaults for Business/Social
            // 4. If Challenge Active, generate next day's challenge task? V1: Just regenerate challenge tasks or keep them? 
            //    Register generates "Daily" tasks. For V1 challenge, let's keep it simple:
            //    If active challenge, ensure today's challenge tasks exist.

            const snoozedTasks = state.tasks
                .filter(t => t.status === 'snoozed')
                .map(t => ({ ...t, status: 'pending' as const, dueDate: new Date().toISOString() })); // Reset to pending for today

            const newBusiness = DashboardTaskRegister.generateDailyTasks('business');
            const newSocial = DashboardTaskRegister.generateDailyTasks('social');

            // Personal/Challenge
            let newPersonal: DashboardTask[] = [];
            if (state.activeChallengeId) {
                // Find template
                // Ideally we'd track progress index. For V1, just giving the daily set again.
                // In a real app we'd have "Day 1 tasks", "Day 2 tasks". 
                // The Register mocks this by just returning the same static set for now.
                // We need to look up the template.
                // Since `DashboardTaskRegister` doesn't export the array directly in a lookup way, 
                // we'll assume we can find it. actually we can import CHALLENGE_TEMPLATES.
                // But let's handle that in the next step or here.
                // Let's import CHALLENGE_TEMPLATES in this file to look it up.
            }

            setState(prev => ({
                ...prev,
                lastVisitDate: today,
                tasks: [...snoozedTasks, ...newBusiness, ...newSocial, ...newPersonal]
            }));

            // If we didn't generate personal tasks above (because of import scope), we handle it below or assume user manually starts.
            // Actually, let's do a quick check if state.tasks is empty on mount too.
        }
    }, []);

    // Initial Population if Empty (First Run)
    useEffect(() => {
        if (state.tasks.length === 0 && state.lastVisitDate === '') {
            const newBusiness = DashboardTaskRegister.generateDailyTasks('business');
            const newSocial = DashboardTaskRegister.generateDailyTasks('social');
            const today = new Date().toISOString().split('T')[0];

            setState(prev => ({
                ...prev,
                lastVisitDate: today,
                tasks: [...newBusiness, ...newSocial]
            }));
        }
    }, [state.tasks.length, state.lastVisitDate]);


    const markDone = useCallback((taskId: string) => {
        setState(prev => {
            const task = prev.tasks.find(t => t.id === taskId);
            if (!task) return prev;

            DashboardEventLogger.log(task.domain === 'personal' ? 'challenge_task_completed' : 'task_completed', { taskId, title: task.title });

            const newStreak = task.domain === 'social' ? prev.socialStreak + 1 : prev.socialStreak;

            return {
                ...prev,
                socialStreak: newStreak,
                tasks: prev.tasks.filter(t => t.id !== taskId) // Remove from list immediately
            };
        });
    }, []);

    const snooze = useCallback((taskId: string) => {
        setState(prev => {
            DashboardEventLogger.log('task_snoozed', { taskId });
            return {
                ...prev,
                tasks: prev.tasks.map(t =>
                    t.id === taskId
                        ? { ...t, status: 'snoozed', dueDate: new Date(Date.now() + 86400000).toISOString() }
                        : t
                )
            };
        });
    }, []);

    const dismiss = useCallback((taskId: string) => {
        setState(prev => {
            DashboardEventLogger.log('task_dismissed', { taskId });
            return {
                ...prev,
                tasks: prev.tasks.filter(t => t.id !== taskId) // Remove
            };
        });
    }, []);

    const startChallenge = useCallback((template: ChallengeTemplate) => {
        const tasks = DashboardTaskRegister.generateChallengeTasks(template);
        DashboardEventLogger.log('challenge_started', { templateId: template.id });

        setState(prev => ({
            ...prev,
            activeChallengeId: template.id,
            challengeStartDate: new Date().toISOString(),
            // Remove existing personal tasks?? replace with new challenge
            tasks: [...prev.tasks.filter(t => t.domain !== 'personal'), ...tasks]
        }));
    }, []);

    // Filter tasks for consumption
    const businessTasks = state.tasks.filter(t => t.domain === 'business' && t.status !== 'snoozed').sort((a, b) => (a.priority === 'high' ? -1 : 1));
    const socialTasks = state.tasks.filter(t => t.domain === 'social' && t.status !== 'snoozed').sort((a, b) => (a.priority === 'high' ? -1 : 1));
    const personalTasks = state.tasks.filter(t => t.domain === 'personal' && t.status !== 'snoozed').sort((a, b) => (a.priority === 'high' ? -1 : 1));

    return {
        tasks: {
            business: businessTasks,
            social: socialTasks,
            personal: personalTasks
        },
        stats: {
            socialStreak: state.socialStreak,
            activeChallengeId: state.activeChallengeId
        },
        actions: {
            markDone,
            snooze,
            dismiss,
            startChallenge
        }
    };
}
