import { z } from "zod";

export const fragmentIdSchema = z.string().regex(/^F-\d{6}$/);

export const fragmentSchema = z.object({
  schema_version: z.literal("0.1"),
  id: fragmentIdSchema,
  scope: z.enum(["work", "personal"]),
  type: z.enum([
    "idea",
    "task",
    "learning",
    "requirement",
    "project",
    "question",
    "decision",
    "tracking",
    "resource",
    "note",
  ]),
  status: z.enum([
    "inbox",
    "seed",
    "exploring",
    "defined",
    "actionable",
    "active",
    "waiting",
    "done",
    "archived",
  ]),
  priority: z.enum(["high", "medium", "low", "none"]),
  urgency: z.enum(["high", "medium", "low", "none"]),
  domains: z.array(z.string().min(1)),
  tags: z.array(z.string().min(1)),
  title: z.string().min(1),
  summary: z.string(),
  original_input: z.string().min(1),
  next_action: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  related: z.array(fragmentIdSchema),
  project: fragmentIdSchema.nullable(),
  interview: z.array(
    z.object({
      question: z.string().min(1),
      answer: z.string(),
    }),
  ),
  source: z.object({
    channel: z.enum(["chatgpt", "web"]),
  }),
  ai: z.object({
    classification_confirmed: z.boolean(),
    interview_used: z.boolean(),
  }),
  created_at: z.iso.datetime({ offset: true }),
  updated_at: z.iso.datetime({ offset: true }),
});

export type Fragment = z.infer<typeof fragmentSchema>;
