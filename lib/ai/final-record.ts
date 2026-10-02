import type { Fragment } from "@/lib/fragment-schema";
import {
  confirmedFragmentAnalysisSchema,
  finalizedContentSchema,
  interviewAnswerSchema,
  type ConfirmedFragmentAnalysis,
  type FinalizedContent,
  type InterviewAnswer,
} from "@/lib/analysis-schema";

export type FragmentWriteDraft = Omit<
  Fragment,
  "id" | "created_at" | "updated_at"
>;

export function buildFinalRecordDraft(input: {
  originalInput: string;
  analysis: ConfirmedFragmentAnalysis;
  interview: readonly InterviewAnswer[];
  content: FinalizedContent;
  source: "chatgpt" | "web";
}): FragmentWriteDraft {
  const analysis = confirmedFragmentAnalysisSchema.parse(input.analysis);
  const interview = input.interview.map((item) =>
    interviewAnswerSchema.parse(item),
  );
  const content = finalizedContentSchema.parse(input.content);

  return {
    schema_version: "0.1",
    scope: analysis.scope,
    type: analysis.type,
    status: analysis.status,
    priority: analysis.priority,
    urgency: analysis.urgency,
    domains: analysis.domains,
    tags: analysis.tags,
    project: analysis.project,
    related: analysis.related,
    title: content.title,
    summary: content.summary,
    next_action: content.next_action,
    original_input: input.originalInput,
    notes: content.notes,
    interview,
    source: {
      channel: input.source,
    },
    ai: {
      classification_confirmed: true,
      interview_used: interview.length > 0,
    },
  };
}
