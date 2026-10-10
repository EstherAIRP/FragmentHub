import assert from "node:assert/strict";
import test from "node:test";

import {
  fragmentSchema,
  fragmentStatusSchema,
  type Fragment,
} from "../lib/fragment-schema";
import {
  boardScore,
  countRecentlyDone,
  filterByScope,
  groupBoard,
  listIncubating,
  parseBoardScope,
} from "../lib/fragments/board";
import {
  manualFragmentDraftSchema,
  toFragmentWriteInput,
} from "../lib/fragments/manual-draft";
import { domainLabel } from "../lib/fragments/presentation";
import { filterFragments } from "../lib/fragments/query";
import { buildStatusMoveDraft } from "../lib/fragments/status-move";
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
    status: "inbox",
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
    status: "inbox",
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
    status: "inbox",
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
    status: "inbox",
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

test("status enum rejects removed lifecycle values", () => {
  assert.deepEqual(fragmentStatusSchema.options, [
    "incubating",
    "inbox",
    "active",
    "waiting",
    "done",
    "archived",
  ]);

  for (const status of ["seed", "exploring", "defined", "actionable"]) {
    assert.equal(fragmentStatusSchema.safeParse(status).success, false);
    assert.throws(() => fragment({ status: status as Fragment["status"] }));
  }
});

test("board groups inbox/active/waiting and sorts by score then recency", () => {
  const items = [
    fragment({ id: "F-000001", status: "inbox", priority: "low", urgency: "low", updated_at: "2026-10-05T00:00:00+08:00" }),
    fragment({ id: "F-000002", status: "inbox", priority: "high", urgency: "none", updated_at: "2026-10-03T00:00:00+08:00" }),
    fragment({ id: "F-000003", status: "inbox", priority: "medium", urgency: "medium", updated_at: "2026-10-04T00:00:00+08:00" }),
    fragment({ id: "F-000004", status: "inbox", priority: "high", urgency: "high", updated_at: "2026-10-02T16:00:00+08:00" }),
    fragment({ id: "F-000005", status: "active" }),
    fragment({ id: "F-000006", status: "waiting" }),
    fragment({ id: "F-000007", status: "incubating" }),
    fragment({ id: "F-000008", status: "done" }),
    fragment({ id: "F-000009", status: "archived" }),
  ];

  const columns = groupBoard(items);

  assert.equal(boardScore({ priority: "high", urgency: "medium" }), 5);
  // F-000004 scores 6; F-000003 (4) beats F-000002 (3) on score; ties fall back to updated_at.
  assert.deepEqual(
    columns.inbox.map((item) => item.id),
    ["F-000004", "F-000003", "F-000002", "F-000001"],
  );
  assert.deepEqual(columns.active.map((item) => item.id), ["F-000005"]);
  assert.deepEqual(columns.waiting.map((item) => item.id), ["F-000006"]);
});

test("board breaks score ties by most recent update", () => {
  const columns = groupBoard([
    fragment({ id: "F-000001", status: "active", updated_at: "2026-10-03T00:00:00+08:00" }),
    fragment({ id: "F-000002", status: "active", updated_at: "2026-10-05T00:00:00+08:00" }),
  ]);

  assert.deepEqual(columns.active.map((item) => item.id), ["F-000002", "F-000001"]);
});

test("board scope parsing and filtering", () => {
  const items = [
    fragment({ id: "F-000001", scope: "work" }),
    fragment({ id: "F-000002", scope: "personal" }),
  ];

  assert.equal(parseBoardScope("work"), "work");
  assert.equal(parseBoardScope("personal"), "personal");
  assert.equal(parseBoardScope("bogus"), "all");
  assert.equal(parseBoardScope(undefined), "all");
  assert.deepEqual(filterByScope(items, "work").map((item) => item.id), ["F-000001"]);
  assert.equal(filterByScope(items, "all").length, 2);
});

test("incubating list holds only incubating Fragments, newest first", () => {
  const items = listIncubating([
    fragment({ id: "F-000001", status: "incubating", updated_at: "2026-10-03T00:00:00+08:00" }),
    fragment({ id: "F-000002", status: "incubating", updated_at: "2026-10-06T00:00:00+08:00" }),
    fragment({ id: "F-000003", status: "inbox" }),
    fragment({ id: "F-000004", status: "archived" }),
  ]);

  assert.deepEqual(items.map((item) => item.id), ["F-000002", "F-000001"]);
});

test("recently done counts done Fragments updated within 7 days", () => {
  const now = new Date("2026-10-10T12:00:00+08:00");
  const items = [
    fragment({ id: "F-000001", status: "done", updated_at: "2026-10-09T00:00:00+08:00" }),
    fragment({ id: "F-000002", status: "done", updated_at: "2026-10-03T13:00:00+08:00" }),
    fragment({ id: "F-000003", status: "done", updated_at: "2026-10-02T16:00:00+08:00" }),
    fragment({ id: "F-000004", status: "active", updated_at: "2026-10-09T00:00:00+08:00" }),
  ];

  assert.equal(countRecentlyDone(items, now), 2);
});

test("status move draft round-trips every stored field except status", () => {
  const current = fragment({
    status: "inbox",
    scope: "work",
    type: "task",
    priority: "high",
    urgency: "medium",
    domains: ["automation-rpa", "ai"],
    tags: ["ocr", "rpa"],
    title: "OCR check",
    summary: "Check OCR flow.",
    next_action: "Run test.",
    notes: "Some notes.",
    original_input: "  Keep  original\nwhitespace  ",
    interview: [{ question: "Q?", answer: "A" }],
    source: { channel: "chatgpt" },
    ai: { classification_confirmed: true, interview_used: true },
  });

  const move = buildStatusMoveDraft(current);
  assert.equal(move.ok, true);
  if (!move.ok) return;

  const draft = manualFragmentDraftSchema.parse({ ...move.draft, status: "done" });
  const replacement = prepareReplacement(current, draft);

  assert.deepEqual(replacement, { ...current, status: "done" });
});

test("status move refuses Fragments the draft schema would alter or reject", () => {
  const padded = fragment({ title: " Padded title " });
  const unknownDomain = fragment({ domains: ["not-a-domain"] });

  assert.equal(buildStatusMoveDraft(padded).ok, false);
  assert.equal(buildStatusMoveDraft(unknownDomain).ok, false);
});
