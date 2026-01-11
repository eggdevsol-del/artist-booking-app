import { router } from "../_core/trpc";
import { appointmentsRouter } from "./appointments";
import { artistSettingsRouter } from "./artistSettings";
import { authRouter } from "./auth";
import { consultationsRouter } from "./consultations";
import { conversationsRouter } from "./conversations";
import { messagesRouter } from "./messages";
import { notificationTemplatesRouter } from "./notificationTemplates";
import { policiesRouter } from "./policies";
import { quickActionsRouter } from "./quickActions";
import { systemRouter } from "./system";

export const appRouter = router({
    system: systemRouter,
    auth: authRouter,
    artistSettings: artistSettingsRouter,
    conversations: conversationsRouter,
    messages: messagesRouter,
    appointments: appointmentsRouter,
    quickActions: quickActionsRouter,
    notificationTemplates: notificationTemplatesRouter,
    policies: policiesRouter,
    consultations: consultationsRouter,
});

export type AppRouter = typeof appRouter;
