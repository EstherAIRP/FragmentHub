import { z } from "zod";

import domainsConfig from "@/config/domains.json";
import {
  fragmentIdSchema,
  fragmentStatusSchema,
  fragmentTypeSchema,
  levelSchema,
  scopeSchema,
  slugSchema,
  type Fragment,
} from "@/lib/fragment-schema";

const domainIds = Object.keys(domainsConfig.domains);

const domainSchema = slugSchema.refine(
  (value) => domainIds.includes(value),
  "Unknown domain.",
);

export const manualFragmentDraftSchema = z.object({
  scope: scopeSchema,
  type: fragmentTypeSchema,
  status: fragmentStatusSchema,
  priority: levelSchema,
  urgency: levelSchema,
  domains: z.array(domainSchema).max(5),
  tags: z.array(slugSchema).max(12),
  project: fragmentIdSchema.nullable(),
  related: z.array(fragmentIdSchema),
  title: z.string().trim().min(1).max(120),
  summary: z.string().max(2000),
  next_action: z.string().max(2000).nullable(),
  original_input: z.string().trim().min(1),
  notes: z.string().nullable(),
});

export type ManualFragmentDraft = z.infer<typeof manualFragmentDraftSchema>;

export type FragmentWriteInput = Omit<
  Fragment,
  "id" | "created_at" | "updated_at"
>;

export function toFragmentWriteInput(
  draft: ManualFragmentDraft,
): FragmentWriteInput {
  const parsed = manualFragmentDraftSchema.parse(draft);

  return {
    schema_version: "0.1",
    ...parsed,
    interview: [],
    source: {
      channel: "web",
    },
    ai: {
      classification_confirmed: true,
      interview_used: false,
    },
  };
}
