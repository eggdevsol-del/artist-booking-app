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
import { uploadRouter } from "./upload";

import { bookingRouter } from "./booking";
import { dashboardRouter } from "./dashboard";
import { portfolioRouter } from "./portfolio";
import { walletRouter } from "./wallet";

export const appRouter = router({
    auth: authRouter,
    system: systemRouter,
    artistSettings: artistSettingsRouter,
    conversations: conversationsRouter,
    messages: messagesRouter,
    appointments: appointmentsRouter,
    booking: bookingRouter,
    notifications: notificationTemplatesRouter,
    consultations: consultationsRouter,
    policies: policiesRouter,
    quickActions: quickActionsRouter,
    upload: uploadRouter,
    dashboard: dashboardRouter,
    portfolio: portfolioRouter,
    wallet: walletRouter,
});

export type AppRouter = typeof appRouter;
