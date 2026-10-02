import assert from "node:assert/strict";
import test from "node:test";

import { fragmentSchema, type Fragment } from "../lib/fragment-schema";
import {
  manualFragmentDraftSchema,
  toFragmentWriteInput,
} from "../lib/fragments/manual-draft";
import { filterFragments } from "../lib/fragments/query";

function fragment(overrides: Partial<Fragment> = {}): Fragment {
  return fragmentSchema.parse({
    schema_version: "0.1",
    id: "F-000001",
    created_at: "2026-10-02T16:00:00+08:00",
    updated_at: "2026-10-02T16:00:00+08:00",
    scope: "personal",
    type: "note",
    status: "defined",
    priority: "none",
    urgency: "none",
    domains: ["knowledge-management"],
    tags: ["fragment-management"],
    project: null,
    related: [],
    title: "FragmentHub note",
    summary: "A note about FragmentHub.",
    next_action: null,
    original_input: "note",
    notes: null,
    interview: [],
    source: { channel: "web" },
    ai: {
      classification_confirmed: true,
      interview_used: false,
    },
    ...overrides,
  });
}

test("fragment filters combine search and metadata filters", () => {
  const items = [
    fragment({
      id: "F-000001",
      scope: "personal",
      title: "AI memory notes",
      tags: ["memory"],
      domains: ["ai"],
    }),
    fragment({
      id: "F-000002",
      scope: "work",
      title: "RPA OCR task",
      tags: ["ocr"],
      domains: ["automation-rpa"],
    }),
  ];

  const result = filterFragments(items, {
    scope: "work",
    q: "ocr",
    domain: "automation-rpa",
  });

  assert.deepEqual(result.map((item) => item.id), ["F-000002"]);
});

test("manual draft rejects unregistered domains", () => {
  const result = manualFragmentDraftSchema.safeParse({
    scope: "personal",
    type: "note",
    status: "defined",
    priority: "none",
    urgency: "none",
    domains: ["made-up-domain"],
    tags: [],
    project: null,
    related: [],
    title: "Test",
    summary: "",
    next_action: null,
    original_input: "Test",
    notes: null,
  });

  assert.equal(result.success, false);
});

test("manual Web draft becomes canonical write input without AI runtime", () => {
  const draft = manualFragmentDraftSchema.parse({
    scope: "work",
    type: "task",
    status: "actionable",
    priority: "high",
    urgency: "medium",
    domains: ["automation-rpa"],
    tags: ["ocr"],
    project: null,
    related: [],
    title: "OCR check",
    summary: "Check OCR flow.",
    next_action: "Run test.",
    original_input: "Need to check OCR.",
    notes: null,
  });

  const writeInput = toFragmentWriteInput(draft);

  assert.equal(writeInput.source.channel, "web");
  assert.equal(writeInput.ai.classification_confirmed, true);
  assert.equal(writeInput.ai.interview_used, false);
  assert.deepEqual(writeInput.interview, []);
});
