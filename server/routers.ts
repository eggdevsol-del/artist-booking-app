import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { uploadRouter } from "./uploadRouter";
import { authRouter } from "./_core/auth-router";
import { notifyNewMessage, notifyAppointmentConfirmed } from "./_core/pushNotification";

// Custom procedure for artist-only operations
const artistProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "artist" && ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Artist access required",
    });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: router({
    ...systemRouter._def.procedures,
    loadDemoData: artistProcedure.mutation(async ({ ctx }) => {
      // Create test client
      const testClientId = "demo-client-" + Date.now();
      await db.upsertUser({
        id: testClientId,
        name: "Sarah Johnson",
        email: "sarah.demo@example.com",
        phone: "+1 (555) 234-5678",
        role: "client",
        loginMethod: "demo",
        bio: "Birthday: 1995-06-15",
      });

      // Create conversation
      const conversation = await db.createConversation({
        artistId: ctx.user.id,
        clientId: testClientId,
      });

      if (!conversation) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create conversation",
        });
      }

      // Create messages
      await db.createMessage({
        conversationId: conversation.id,
        senderId: testClientId,
        content: "Hi! I'd like to book an appointment for a custom tattoo design.",
      });
      await db.createMessage({
        conversationId: conversation.id,
        senderId: ctx.user.id,
        content: "Hello Sarah! I'd love to help with your custom design. What did you have in mind?",
      });
      await db.createMessage({
        conversationId: conversation.id,
        senderId: testClientId,
        content: "I'm thinking of a floral sleeve design with some geometric elements. Do you have any availability next week?",
      });
      await db.createMessage({
        conversationId: conversation.id,
        senderId: ctx.user.id,
        content: "That sounds beautiful! Let me check my calendar and get back to you with some available times.",
      });
      await db.createMessage({
        conversationId: conversation.id,
        senderId: testClientId,
        content: "Perfect, thank you! Looking forward to our appointment!",
      });

      // Create appointment
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      nextWeek.setHours(14, 0, 0, 0);
      const endTime = new Date(nextWeek);
      endTime.setHours(16, 0, 0, 0);

      await db.createAppointment({
        conversationId: conversation.id,
        artistId: ctx.user.id,
        clientId: testClientId,
        title: "Custom Floral Sleeve Tattoo - Consultation",
        description: "Initial consultation and design discussion for custom floral sleeve with geometric elements",
        startTime: nextWeek,
        endTime: endTime,
        serviceName: "Custom Tattoo Design",
        price: 150,
        depositAmount: 50,
        depositPaid: true,
      });

      return { success: true, clientId: testClientId };
    }),
  }),

  auth: router({
    ...authRouter._def.procedures,
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    updateProfile: protectedProcedure
      .input(
        z.object({
          name: z.string().optional(),
          phone: z.string().optional(),
          avatar: z.string().optional(),
          bio: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return db.updateUserProfile(ctx.user.id, input);
      }),
    setRole: protectedProcedure
      .input(z.enum(["artist", "client"]))
      .mutation(async ({ ctx, input }) => {
        return db.updateUserProfile(ctx.user.id, { 
          role: input,
          hasCompletedOnboarding: true 
        });
      }),
    linkInstagram: protectedProcedure
      .input(
        z.object({
          instagramUsername: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return db.updateUserProfile(ctx.user.id, {
          instagramUsername: input.instagramUsername,
        });
      }),
    getInstagramAuthUrl: publicProcedure.query(() => {
      // For now, return empty string - will be replaced with real OAuth URL
      // when Instagram credentials are configured
      return { url: "" };
    }),
    listArtists: publicProcedure.query(async () => {
      // Get all users with artist or admin role
      return db.getArtists();
    }),
  }),

  artistSettings: router({
    get: artistProcedure.query(async ({ ctx }) => {
      const settings = await db.getArtistSettings(ctx.user.id);
      // Return default settings if none exist
      return settings || {
        id: 0,
        userId: ctx.user.id,
        businessName: null,
        businessAddress: null,
        bsb: null,
        accountNumber: null,
        depositAmount: null,
        workSchedule: JSON.stringify({}),
        services: JSON.stringify([]),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }),
    upsert: artistProcedure
      .input(
        z.object({
          businessName: z.string().optional(),
          businessAddress: z.string().optional(),
          bsb: z.string().optional(),
          accountNumber: z.string().optional(),
          depositAmount: z.number().optional(),
          workSchedule: z.string(),
          services: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return db.upsertArtistSettings({
          userId: ctx.user.id,
          ...input,
        });
      }),
  }),

  conversations: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const convos = await db.getConversationsForUser(
        ctx.user.id,
        ctx.user.role
      );

      // Fetch user details for each conversation
      const enriched = await Promise.all(
        convos.map(async (conv) => {
          const otherUserId =
            ctx.user.role === "artist" ? conv.clientId : conv.artistId;
          const otherUser = await db.getUser(otherUserId);
          const unreadCount = await db.getUnreadMessageCount(conv.id, ctx.user.id);

          return {
            ...conv,
            otherUser,
            unreadCount,
          };
        })
      );

      return enriched;
    }),
    getOrCreate: protectedProcedure
      .input(
        z.object({
          artistId: z.string(),
          clientId: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        let conversation = await db.getConversation(
          input.artistId,
          input.clientId
        );

        if (!conversation) {
          conversation = await db.createConversation(input);
        }

        return conversation;
      }),
    getById: protectedProcedure
      .input(z.number())
      .query(async ({ input, ctx }) => {
        const conversation = await db.getConversationById(input);

        if (!conversation) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Conversation not found",
          });
        }

        // Verify user is part of this conversation
        if (
          conversation.artistId !== ctx.user.id &&
          conversation.clientId !== ctx.user.id
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized to view this conversation",
          });
        }

        // Get the other user's details
        const otherUserId =
          ctx.user.id === conversation.artistId
            ? conversation.clientId
            : conversation.artistId;
        const otherUser = await db.getUser(otherUserId);

        return {
          ...conversation,
          otherUser,
        };
      }),
    markAsRead: protectedProcedure
      .input(z.number())
      .mutation(async ({ input, ctx }) => {
        await db.markMessagesAsRead(input, ctx.user.id);
        return { success: true };
      }),
  }),

  messages: router({
    list: protectedProcedure
      .input(
        z.object({
          conversationId: z.number(),
          limit: z.number().optional(),
        })
      )
      .query(async ({ input, ctx }) => {
        // Verify user is part of this conversation
        const conversation = await db.getConversationById(
          input.conversationId
        );

        if (!conversation) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Conversation not found",
          });
        }

        if (
          conversation.artistId !== ctx.user.id &&
          conversation.clientId !== ctx.user.id
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized to view these messages",
          });
        }

        const msgs = await db.getMessages(
          input.conversationId,
          input.limit
        );
        return msgs.reverse(); // Return in chronological order
      }),
    send: protectedProcedure
      .input(
        z.object({
          conversationId: z.number(),
          content: z.string(),
          messageType: z
            .enum(["text", "system", "appointment_request", "appointment_confirmed", "image"])
            .default("text"),
          metadata: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Verify user is part of this conversation
        const conversation = await db.getConversationById(
          input.conversationId
        );

        if (!conversation) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Conversation not found",
          });
        }

        if (
          conversation.artistId !== ctx.user.id &&
          conversation.clientId !== ctx.user.id
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized to send messages in this conversation",
          });
        }

        const message = await db.createMessage({
          conversationId: input.conversationId,
          senderId: ctx.user.id,
          content: input.content,
          messageType: input.messageType,
          metadata: input.metadata,
        });

        // Send push notification to the other user
        const recipientId = conversation.artistId === ctx.user.id 
          ? conversation.clientId 
          : conversation.artistId;
        
        // Only send push for regular messages (not system messages)
        if (input.messageType === "text" || input.messageType === "image") {
          const messagePreview = input.messageType === "image" 
            ? "Sent an image" 
            : input.content;
          
          notifyNewMessage(
            recipientId,
            ctx.user.name || "Someone",
            messagePreview,
            input.conversationId
          ).catch(err => {
            console.error('[Push] Failed to send new message notification:', err);
          });
        }

        // Send appointment confirmation notification
        if (input.messageType === "appointment_confirmed") {
          const dates = input.content.match(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (\w+ \d+, \d{4})/g);
          const firstDate = dates && dates.length > 0 ? dates[0] : "soon";
          
          notifyAppointmentConfirmed(
            recipientId,
            ctx.user.name || "A client",
            firstDate,
            input.conversationId
          ).catch(err => {
            console.error('[Push] Failed to send appointment confirmation notification:', err);
          });
        }

        return message;
      }),
    updateMetadata: protectedProcedure
      .input(
        z.object({
          messageId: z.number(),
          metadata: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Get the message to verify ownership
        const message = await db.getMessageById(input.messageId);
        
        if (!message) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Message not found",
          });
        }
        
        // Verify user is part of the conversation
        const conversation = await db.getConversationById(message.conversationId);
        
        if (!conversation) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Conversation not found",
          });
        }
        
        if (
          conversation.artistId !== ctx.user.id &&
          conversation.clientId !== ctx.user.id
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized to update this message",
          });
        }
        
        // Update the message metadata
        await db.updateMessageMetadata(input.messageId, input.metadata);
        
        return { success: true };
      }),
  }),

  appointments: router({
    list: protectedProcedure
      .input(
        z.object({
          startDate: z.date().optional(),
          endDate: z.date().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        return db.getAppointmentsForUser(
          ctx.user.id,
          ctx.user.role,
          input.startDate,
          input.endDate
        );
      }),
    getByConversation: protectedProcedure
      .input(z.number())
      .query(async ({ input, ctx }) => {
        // Verify user is part of this conversation
        const conversation = await db.getConversationById(input);

        if (!conversation) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Conversation not found",
          });
        }

        if (
          conversation.artistId !== ctx.user.id &&
          conversation.clientId !== ctx.user.id
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized to view these appointments",
          });
        }

        return db.getAppointmentsByConversation(input);
      }),
    create: protectedProcedure
      .input(
        z.object({
          conversationId: z.number(),
          artistId: z.string(),
          clientId: z.string(),
          title: z.string(),
          description: z.string().optional(),
          startTime: z.date(),
          endTime: z.date(),
          serviceName: z.string().optional(),
          price: z.number().optional(),
          depositAmount: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return db.createAppointment({
          ...input,
          status: "pending",
        });
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          description: z.string().optional(),
          startTime: z.date().optional(),
          endTime: z.date().optional(),
          status: z
            .enum(["pending", "confirmed", "cancelled", "completed"])
            .optional(),
          serviceName: z.string().optional(),
          price: z.number().optional(),
          depositAmount: z.number().optional(),
          depositPaid: z.boolean().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const appointment = await db.getAppointment(input.id);

        if (!appointment) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Appointment not found",
          });
        }

        // Verify user is part of this appointment
        if (
          appointment.artistId !== ctx.user.id &&
          appointment.clientId !== ctx.user.id
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized to update this appointment",
          });
        }

        const { id, ...updates } = input;
        return db.updateAppointment(id, updates);
      }),
    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ input, ctx }) => {
        const appointment = await db.getAppointment(input);

        if (!appointment) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Appointment not found",
          });
        }

        // Verify user is part of this appointment
        if (
          appointment.artistId !== ctx.user.id &&
          appointment.clientId !== ctx.user.id
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized to delete this appointment",
          });
        }

        return db.deleteAppointment(input);
      }),
    
    confirmDeposit: artistProcedure
      .input(z.object({
        conversationId: z.number(),
        paymentProof: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Get all pending appointments for this conversation
        const pendingAppointments = await db.getPendingAppointmentsByConversation(input.conversationId);
        
        if (!pendingAppointments || pendingAppointments.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No pending appointments found",
          });
        }
        
        // Confirm all pending appointments
        await db.confirmAppointments(input.conversationId, input.paymentProof);
        
        // TODO: Send push notification to client
        // TODO: Schedule reminder notifications
        
        return { success: true, count: pendingAppointments.length };
      }),
  }),

  quickActions: router({
    list: artistProcedure.query(async ({ ctx }) => {
      return db.getQuickActionButtons(ctx.user.id);
    }),
    create: artistProcedure
      .input(
        z.object({
          label: z.string(),
          actionType: z.enum([
            "send_text",
            "find_availability",
            "deposit_info",
            "custom",
          ]),
          content: z.string(),
          position: z.number(),
          enabled: z.boolean().default(true),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return db.createQuickActionButton({
          userId: ctx.user.id,
          ...input,
        });
      }),
    update: artistProcedure
      .input(
        z.object({
          id: z.number(),
          label: z.string().optional(),
          actionType: z
            .enum([
              "send_text",
              "find_availability",
              "deposit_info",
              "custom",
            ])
            .optional(),
          content: z.string().optional(),
          position: z.number().optional(),
          enabled: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        return db.updateQuickActionButton(id, updates);
      }),
    delete: artistProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        return db.deleteQuickActionButton(input);
      }),
  }),

  notificationTemplates: router({
    list: artistProcedure.query(async ({ ctx }) => {
      return db.getNotificationTemplates(ctx.user.id);
    }),
    create: artistProcedure
      .input(
        z.object({
          templateType: z.enum([
            "confirmation",
            "reminder",
            "follow_up",
            "birthday",
            "promotional",
            "aftercare",
            "preparation",
            "custom",
          ]),
          title: z.string(),
          content: z.string(),
          timing: z.string().optional(),
          enabled: z.boolean().default(true),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return db.createNotificationTemplate({
          userId: ctx.user.id,
          ...input,
        });
      }),
    update: artistProcedure
      .input(
        z.object({
          id: z.number(),
          templateType: z
            .enum([
              "confirmation",
              "reminder",
              "follow_up",
              "birthday",
              "promotional",
              "aftercare",
              "preparation",
              "custom",
            ])
            .optional(),
          title: z.string().optional(),
          content: z.string().optional(),
          timing: z.string().optional(),
          enabled: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        return db.updateNotificationTemplate(id, updates);
      }),
    delete: artistProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        return db.deleteNotificationTemplate(input);
      }),
  }),

  policies: router({
    list: artistProcedure.query(async ({ ctx }) => {
      return db.getPolicies(ctx.user.id);
    }),
    getByType: publicProcedure
      .input(
        z.object({
          artistId: z.string(),
          policyType: z.enum(["deposit", "design", "reschedule", "cancellation"]),
        })
      )
      .query(async ({ input }) => {
        return db.getPolicyByType(input.artistId, input.policyType);
      }),
    upsert: artistProcedure
      .input(
        z.object({
          policyType: z.enum(["deposit", "design", "reschedule", "cancellation"]),
          title: z.string(),
          content: z.string(),
          enabled: z.boolean().default(true),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return db.upsertPolicy({
          artistId: ctx.user.id,
          ...input,
        });
      }),
    delete: artistProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        return db.deletePolicy(input);
      }),
  }),

  consultations: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getConsultationsForUser(ctx.user.id, ctx.user.role);
    }),
    create: protectedProcedure
      .input(
        z.object({
          artistId: z.string(),
          subject: z.string(),
          description: z.string(),
          preferredDate: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return db.createConsultation({
          clientId: ctx.user.id,
          artistId: input.artistId,
          subject: input.subject,
          description: input.description,
          preferredDate: input.preferredDate ? new Date(input.preferredDate) : undefined,
        });
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z
            .enum(["pending", "scheduled", "completed", "cancelled"])
            .optional(),
          conversationId: z.number().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const consultation = await db.getConsultation(input.id);

        if (!consultation) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Consultation not found",
          });
        }

        // Verify user is part of this consultation
        if (
          consultation.artistId !== ctx.user.id &&
          consultation.clientId !== ctx.user.id
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized to update this consultation",
          });
        }

        const { id, ...updates } = input;
        return db.updateConsultation(id, updates);
      }),
  }),

  socialSync: router({
    list: artistProcedure.query(async ({ ctx }) => {
      return db.getAllSocialMessageSyncs(ctx.user.id);
    }),
    get: artistProcedure
      .input(z.enum(["instagram", "facebook"]))
      .query(async ({ ctx, input }) => {
        return db.getSocialMessageSync(ctx.user.id, input);
      }),
    upsert: artistProcedure
      .input(
        z.object({
          platform: z.enum(["instagram", "facebook"]),
          accessToken: z.string().optional(),
          refreshToken: z.string().optional(),
          tokenExpiresAt: z.date().optional(),
          enabled: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return db.upsertSocialMessageSync({
          artistId: ctx.user.id,
          ...input,
        });
      }),
  }),

  pushSubscriptions: router({
    subscribe: protectedProcedure
      .input(
        z.object({
          endpoint: z.string(),
          keys: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return db.createPushSubscription({
          userId: ctx.user.id,
          ...input,
        });
      }),
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getPushSubscriptions(ctx.user.id);
    }),
    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        return db.deletePushSubscription(input);
      }),
  }),

  upload: uploadRouter,
});

export type AppRouter = typeof appRouter;

