import type { Fragment } from "@/lib/fragment-schema";
import {
  manualFragmentDraftSchema,
  type ManualFragmentDraft,
} from "@/lib/fragments/manual-draft";
import { prepareReplacement } from "@/lib/fragments/write";

export type StatusMoveDraft =
  | { ok: true; draft: ManualFragmentDraft }
  | { ok: false; reason: string };

/**
 * Builds the PUT /api/fragments/[id] draft for a status-only move.
 *
 * The draft copies every stored field verbatim. Because the server re-parses
 * the draft (which trims title and only accepts registered domains), we
 * simulate that round trip here and refuse the move when it would change any
 * stored value other than `status`. Such Fragments must go through the edit
 * page, where the user sees the full JSON preview.
 */
export function buildStatusMoveDraft(fragment: Fragment): StatusMoveDraft {
  const draft: ManualFragmentDraft = {
    scope: fragment.scope,
    type: fragment.type,
    status: fragment.status,
    priority: fragment.priority,
    urgency: fragment.urgency,
    domains: fragment.domains,
    tags: fragment.tags,
    project: fragment.project,
    related: fragment.related,
    title: fragment.title,
    summary: fragment.summary,
    next_action: fragment.next_action,
    original_input: fragment.original_input,
    notes: fragment.notes,
    interview: fragment.interview,
    source: fragment.source,
    ai: fragment.ai,
  };

  const parsed = manualFragmentDraftSchema.safeParse(draft);
  if (!parsed.success) {
    return { ok: false, reason: "此筆資料需在編輯頁修正後才能移動" };
  }

  const roundTrip = prepareReplacement(fragment, parsed.data);
  if (!sameFields(roundTrip, fragment)) {
    return { ok: false, reason: "此筆資料需在編輯頁修正後才能移動" };
  }

  return { ok: true, draft };
}

function sameFields(a: Fragment, b: Fragment) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);

  for (const key of keys) {
    const left = JSON.stringify(a[key as keyof Fragment]);
    const right = JSON.stringify(b[key as keyof Fragment]);
    if (left !== right) return false;
  }

  return true;
}
