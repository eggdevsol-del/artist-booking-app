import { ActionType } from "./types";

export const CommsHandler = {
    openPrefilledEmail: (to: string, subject?: string, body?: string) => {
        const params = new URLSearchParams();
        if (subject) params.append('subject', subject);
        if (body) params.append('body', body);

        const url = `mailto:${to}?${params.toString()}`;
        window.location.href = url;
    },

    openPrefilledSms: (phone: string, body?: string, platform: 'ios' | 'android' | 'desktop' = 'ios') => {
        // SMS handling varies slightly by platform ('&' vs '?') but modern OS usually handle both.
        // iOS: sms:123&body=Text
        // Android: sms:123?body=Text

        const separator = platform === 'ios' ? '&' : '?';
        const url = `sms:${phone}${body ? `${separator}body=${encodeURIComponent(body)}` : ''}`;

        if (platform === 'desktop') {
            // Desktop fallback: prompt copy
            return false; // Signal that we failed to open native and need fallback UI
        }

        window.location.href = url;
        return true;
    }
};
