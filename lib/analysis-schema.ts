import { z } from "zod";

export const fragmentAnalysisSchema = z.object({
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
  domains: z.array(z.string()),
  tags: z.array(z.string()),
  title: z.string(),
  summary: z.string(),
  next_action: z.string().nullable(),
  notes: z.string().nullable(),
  classification_reason: z.string(),
});

export type FragmentAnalysis = z.infer<typeof fragmentAnalysisSchema>;

export const fragmentAnalysisJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "scope",
    "type",
    "status",
    "priority",
    "urgency",
    "domains",
    "tags",
    "title",
    "summary",
    "next_action",
    "notes",
    "classification_reason",
  ],
  properties: {
    scope: { type: "string", enum: ["work", "personal"] },
    type: {
      type: "string",
      enum: [
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
      ],
    },
    status: {
      type: "string",
      enum: [
        "inbox",
        "seed",
        "exploring",
        "defined",
        "actionable",
        "active",
        "waiting",
        "done",
        "archived",
      ],
    },
    priority: {
      type: "string",
      enum: ["high", "medium", "low", "none"],
    },
    urgency: {
      type: "string",
      enum: ["high", "medium", "low", "none"],
    },
    domains: {
      type: "array",
      items: { type: "string" },
    },
    tags: {
      type: "array",
      items: { type: "string" },
    },
    title: { type: "string" },
    summary: { type: "string" },
    next_action: {
      anyOf: [{ type: "string" }, { type: "null" }],
    },
    notes: {
      anyOf: [{ type: "string" }, { type: "null" }],
    },
    classification_reason: { type: "string" },
  },
} as const;
