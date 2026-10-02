import { z } from "zod";

import domainsConfig from "@/config/domains.json";
import {
  fragmentIdSchema,
  fragmentStatusSchema,
  fragmentTypeSchema,
  levelSchema,
  scopeSchema,
  slugSchema,
} from "@/lib/fragment-schema";

export const controlledDomainIds = Object.keys(domainsConfig.domains);

const controlledDomainSchema = slugSchema.refine(
  (value) => controlledDomainIds.includes(value),
  "Domain must exist in config/domains.json.",
);

export const fragmentAnalysisSchema = z.object({
  scope: scopeSchema,
  type: fragmentTypeSchema,
  status: fragmentStatusSchema,
  priority: levelSchema,
  urgency: levelSchema,
  domains: z.array(controlledDomainSchema).max(5),
  tags: z.array(slugSchema).max(12),
  project: fragmentIdSchema.nullable(),
  related: z.array(fragmentIdSchema),
  title: z.string().min(1).max(120),
  summary: z.string().max(2000),
  next_action: z.string().max(2000).nullable(),
  notes: z.string().nullable(),
  domain_suggestion: z.string().max(120).nullable(),
  classification_reason: z.string().min(1).max(1000),
});

export const confirmedFragmentAnalysisSchema = fragmentAnalysisSchema.extend({
  confirmed: z.literal(true),
});

export const interviewAnswerSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

export const interviewDecisionSchema = z
  .object({
    complete: z.boolean(),
    question: z.string().min(1).nullable(),
    focus: z.string().min(1).nullable(),
    completion_reason: z.string().min(1).max(500),
  })
  .superRefine((value, ctx) => {
    if (value.complete && value.question !== null) {
      ctx.addIssue({
        code: "custom",
        path: ["question"],
        message: "question must be null when complete=true.",
      });
    }

    if (!value.complete && value.question === null) {
      ctx.addIssue({
        code: "custom",
        path: ["question"],
        message: "question is required when complete=false.",
      });
    }
  });

export const finalizedContentSchema = z.object({
  title: z.string().min(1).max(120),
  summary: z.string().max(2000),
  next_action: z.string().max(2000).nullable(),
  notes: z.string().nullable(),
});

export type FragmentAnalysis = z.infer<typeof fragmentAnalysisSchema>;
export type ConfirmedFragmentAnalysis = z.infer<
  typeof confirmedFragmentAnalysisSchema
>;
export type InterviewAnswer = z.infer<typeof interviewAnswerSchema>;
export type InterviewDecision = z.infer<typeof interviewDecisionSchema>;
export type FinalizedContent = z.infer<typeof finalizedContentSchema>;

const domainEnum = {
  type: "string",
  enum: controlledDomainIds,
} as const;

const fragmentIdJsonSchema = {
  type: "string",
  pattern: "^F-[0-9]{6}$",
} as const;

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
    "project",
    "related",
    "title",
    "summary",
    "next_action",
    "notes",
    "domain_suggestion",
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
      maxItems: 5,
      uniqueItems: true,
      items: domainEnum,
    },
    tags: {
      type: "array",
      maxItems: 12,
      uniqueItems: true,
      items: {
        type: "string",
        pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
      },
    },
    project: {
      anyOf: [fragmentIdJsonSchema, { type: "null" }],
    },
    related: {
      type: "array",
      uniqueItems: true,
      items: fragmentIdJsonSchema,
    },
    title: {
      type: "string",
      minLength: 1,
      maxLength: 120,
    },
    summary: {
      type: "string",
      maxLength: 2000,
    },
    next_action: {
      anyOf: [
        { type: "string", maxLength: 2000 },
        { type: "null" },
      ],
    },
    notes: {
      anyOf: [{ type: "string" }, { type: "null" }],
    },
    domain_suggestion: {
      anyOf: [
        { type: "string", maxLength: 120 },
        { type: "null" },
      ],
    },
    classification_reason: {
      type: "string",
      minLength: 1,
      maxLength: 1000,
    },
  },
} as const;

export const interviewDecisionJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "complete",
    "question",
    "focus",
    "completion_reason",
  ],
  properties: {
    complete: { type: "boolean" },
    question: {
      anyOf: [{ type: "string", minLength: 1 }, { type: "null" }],
    },
    focus: {
      anyOf: [{ type: "string", minLength: 1 }, { type: "null" }],
    },
    completion_reason: {
      type: "string",
      minLength: 1,
      maxLength: 500,
    },
  },
} as const;

export const finalizedContentJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "summary", "next_action", "notes"],
  properties: {
    title: {
      type: "string",
      minLength: 1,
      maxLength: 120,
    },
    summary: {
      type: "string",
      maxLength: 2000,
    },
    next_action: {
      anyOf: [
        { type: "string", maxLength: 2000 },
        { type: "null" },
      ],
    },
    notes: {
      anyOf: [{ type: "string" }, { type: "null" }],
    },
  },
} as const;
