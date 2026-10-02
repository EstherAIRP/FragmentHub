import assert from "node:assert/strict";
import test from "node:test";

import {
  confirmedFragmentAnalysisSchema,
  fragmentAnalysisSchema,
  interviewDecisionSchema,
  type FragmentAnalysis,
} from "../lib/analysis-schema";
import { sanitizeAnalysisRelations } from "../lib/ai/analysis";
import { buildFinalRecordDraft } from "../lib/ai/final-record";
import {
  appendInterviewAnswer,
  confirmAnalysis,
  reopenConfirmedAnalysis,
} from "../lib/ai/workflow";
import { fragmentSchema, type Fragment } from "../lib/fragment-schema";

function analysis(
  overrides: Partial<FragmentAnalysis> = {},
): FragmentAnalysis {
  return fragmentAnalysisSchema.parse({
    scope: "personal",
    type: "idea",
    status: "seed",
    priority: "medium",
    urgency: "low",
    domains: ["knowledge-management"],
    tags: ["fragment-management"],
    project: null,
    related: [],
    title: "Test idea",
    summary: "A test idea.",
    next_action: null,
    notes: null,
    domain_suggestion: null,
    classification_reason: "The input is an early-stage idea.",
    ...overrides,
  });
}

function fragment(overrides: Partial<Fragment> = {}): Fragment {
  return fragmentSchema.parse({
    schema_version: "0.1",
    id: "F-000001",
    created_at: "2026-10-02T16:00:00+08:00",
    updated_at: "2026-10-02T16:00:00+08:00",
    scope: "personal",
    type: "idea",
    status: "seed",
    priority: "medium",
    urgency: "low",
    domains: ["knowledge-management"],
    tags: ["fragment-management"],
    project: null,
    related: [],
    title: "Existing",
    summary: "Existing Fragment.",
    next_action: null,
    original_input: "existing",
    notes: null,
    interview: [],
    source: { channel: "chatgpt" },
    ai: {
      classification_confirmed: true,
      interview_used: false,
    },
    ...overrides,
  });
}

test("analysis only accepts controlled domains", () => {
  const result = fragmentAnalysisSchema.safeParse({
    ...analysis(),
    domains: ["made-up-domain"],
  });

  assert.equal(result.success, false);
});

test("relation sanitization removes missing and non-project suggestions", () => {
  const project = fragment({
    id: "F-000002",
    type: "project",
    title: "Project",
  });
  const idea = fragment({
    id: "F-000003",
    type: "idea",
    title: "Idea",
  });

  const result = sanitizeAnalysisRelations(
    analysis({
      project: "F-000003",
      related: ["F-000002", "F-000999"],
    }),
    [project, idea],
  );

  assert.equal(result.analysis.project, null);
  assert.deepEqual(result.analysis.related, ["F-000002"]);
  assert.equal(result.warnings.length, 2);
});

test("confirming and reopening analysis changes only confirmation state", () => {
  const original = analysis();
  const confirmed = confirmAnalysis(original);

  assert.equal(confirmed.confirmed, true);

  const reopened = reopenConfirmedAnalysis(confirmed);
  assert.deepEqual(reopened, original);
});

test("interview decision requires a question when not complete", () => {
  const result = interviewDecisionSchema.safeParse({
    complete: false,
    question: null,
    focus: "goal",
    completion_reason: "Need one more detail.",
  });

  assert.equal(result.success, false);
});

test("interview helper enforces the six-question limit", () => {
  const six = Array.from({ length: 6 }, (_, index) => ({
    question: `Q${index + 1}`,
    answer: `A${index + 1}`,
  }));

  assert.throws(() =>
    appendInterviewAnswer(six, {
      question: "Q7",
      answer: "A7",
    }),
  );
});

test("final record preserves confirmed metadata and original input", () => {
  const confirmed = confirmedFragmentAnalysisSchema.parse({
    ...analysis({
      scope: "work",
      type: "requirement",
      status: "defined",
      priority: "high",
      urgency: "medium",
      domains: ["automation-rpa"],
      tags: ["ocr", "workflow"],
      project: null,
      related: [],
    }),
    confirmed: true,
  });

  const draft = buildFinalRecordDraft({
    originalInput: "原始輸入不可被模型覆蓋。",
    analysis: confirmed,
    interview: [
      {
        question: "完成條件是什麼？",
        answer: "流程可穩定執行。",
      },
    ],
    content: {
      title: "OCR 流程需求",
      summary: "整理後摘要。",
      next_action: "建立驗證案例。",
      notes: "補充限制。",
    },
    source: "web",
  });

  assert.equal(draft.scope, "work");
  assert.equal(draft.type, "requirement");
  assert.equal(draft.priority, "high");
  assert.deepEqual(draft.domains, ["automation-rpa"]);
  assert.equal(draft.original_input, "原始輸入不可被模型覆蓋。");
  assert.equal(draft.ai.classification_confirmed, true);
  assert.equal(draft.ai.interview_used, true);
});
