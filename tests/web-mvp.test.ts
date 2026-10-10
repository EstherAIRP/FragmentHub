import assert from "node:assert/strict";
import test from "node:test";

import { fragmentSchema, type Fragment } from "../lib/fragment-schema";
import {
  manualFragmentDraftSchema,
  toFragmentWriteInput,
} from "../lib/fragments/manual-draft";
import { domainLabel } from "../lib/fragments/presentation";
import { filterFragments } from "../lib/fragments/query";
import { normalizeTag, normalizeTags } from "../lib/fragments/tags";
import { prepareCreateInput, prepareReplacement } from "../lib/fragments/write";

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
    interview: [],
    source: { channel: "web" },
    ai: {
      classification_confirmed: true,
      interview_used: false,
    },
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
    interview: [],
    source: { channel: "web" },
    ai: {
      classification_confirmed: true,
      interview_used: false,
    },
  });

  const writeInput = toFragmentWriteInput(draft);

  assert.equal(writeInput.source.channel, "web");
  assert.equal(writeInput.ai.classification_confirmed, true);
  assert.equal(writeInput.ai.interview_used, false);
  assert.deepEqual(writeInput.interview, []);
});


test("Web create ignores forged system metadata", () => {
  const draft = manualFragmentDraftSchema.parse({
    scope: "personal",
    type: "note",
    status: "defined",
    priority: "none",
    urgency: "none",
    domains: ["knowledge-management"],
    tags: ["manual"],
    project: null,
    related: [],
    title: "Manual create",
    summary: "",
    next_action: null,
    original_input: "Original",
    notes: null,
    interview: [{ question: "Forged?", answer: "Yes" }],
    source: { channel: "chatgpt" },
    ai: {
      classification_confirmed: true,
      interview_used: true,
    },
  });

  const input = prepareCreateInput(draft);

  assert.equal(input.source.channel, "web");
  assert.deepEqual(input.interview, []);
  assert.equal(input.ai.interview_used, false);
});

test("Web edit preserves immutable source, interview and original input", () => {
  const current = fragment({
    source: { channel: "chatgpt" },
    original_input: "Keep this original text.",
    interview: [{ question: "Q?", answer: "A" }],
    ai: {
      classification_confirmed: true,
      interview_used: true,
    },
  });

  const draft = manualFragmentDraftSchema.parse({
    scope: "work",
    type: "task",
    status: "active",
    priority: "high",
    urgency: "medium",
    domains: ["automation-rpa"],
    tags: ["changed"],
    project: null,
    related: [],
    title: "Changed title",
    summary: "Changed summary",
    next_action: "Do it.",
    original_input: "Attempted overwrite.",
    notes: "Updated notes.",
    interview: [],
    source: { channel: "web" },
    ai: {
      classification_confirmed: true,
      interview_used: false,
    },
  });

  const replacement = prepareReplacement(current, draft);

  assert.equal(replacement.original_input, "Keep this original text.");
  assert.equal(replacement.source.channel, "chatgpt");
  assert.deepEqual(replacement.interview, [{ question: "Q?", answer: "A" }]);
  assert.equal(replacement.ai.interview_used, true);
  assert.equal(replacement.title, "Changed title");
  assert.equal(replacement.status, "active");
});

test("fragment search also matches next action, notes, original input and domain labels", () => {
  const items = [
    fragment({
      id: "F-000001",
      title: "Vision idea",
      domains: ["computer-vision"],
      next_action: "Collect sample images",
    }),
    fragment({
      id: "F-000002",
      title: "Notes only",
      domains: ["life"],
      notes: "Remember the dentist",
      original_input: "週末要整理書櫃",
    }),
  ];

  const ids = (q: string) =>
    filterFragments(items, { q }).map((item) => item.id);

  assert.deepEqual(ids("電腦視覺"), ["F-000001"]);
  assert.deepEqual(ids("sample images"), ["F-000001"]);
  assert.deepEqual(ids("dentist"), ["F-000002"]);
  assert.deepEqual(ids("整理書櫃"), ["F-000002"]);
  assert.deepEqual(ids("computer-vision"), ["F-000001"]);
});

test("domainLabel resolves configured labels and falls back to the ID", () => {
  assert.equal(domainLabel("computer-vision"), "電腦視覺");
  assert.equal(domainLabel("not-a-domain"), "not-a-domain");
});

test("normalizeTag produces lowercase kebab-case tags", () => {
  assert.equal(normalizeTag("  OCR  "), "ocr");
  assert.equal(normalizeTag("Fragment Management"), "fragment-management");
  assert.equal(normalizeTag("snake_case__tag"), "snake-case-tag");
  assert.equal(normalizeTag("a - b"), "a-b");
  assert.equal(normalizeTag("   "), "");
  assert.deepEqual(normalizeTags(["OCR", "ocr", " ", "Work Flow"]), [
    "ocr",
    "work-flow",
  ]);
});
