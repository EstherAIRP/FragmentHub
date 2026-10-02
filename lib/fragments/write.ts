import { fragmentSchema, type Fragment } from "@/lib/fragment-schema";
import {
  manualFragmentDraftSchema,
  toFragmentWriteInput,
  type ManualFragmentDraft,
  type FragmentWriteInput,
} from "@/lib/fragments/manual-draft";

export function prepareCreateInput(
  draft: ManualFragmentDraft,
): FragmentWriteInput {
  return toFragmentWriteInput(manualFragmentDraftSchema.parse(draft));
}

export function prepareReplacement(
  current: Fragment,
  draft: ManualFragmentDraft,
): Fragment {
  const writeInput = toFragmentWriteInput(
    manualFragmentDraftSchema.parse(draft),
  );

  return fragmentSchema.parse({
    ...writeInput,
    id: current.id,
    created_at: current.created_at,
    updated_at: current.updated_at,
  });
}
