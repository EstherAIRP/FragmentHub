import domainsConfig from "@/config/domains.json";
import { FragmentForm } from "@/components/fragment-form";
import { listFragments } from "@/lib/fragments";
import { isGitHubRemoteConfigured } from "@/lib/github/availability";
import type { ManualFragmentDraft } from "@/lib/fragments/manual-draft";

const initial: ManualFragmentDraft = {
  scope: "personal",
  type: "note",
  status: "inbox",
  priority: "none",
  urgency: "none",
  domains: [],
  tags: [],
  project: null,
  related: [],
  title: "",
  summary: "",
  next_action: null,
  original_input: "",
  notes: null,
  interview: [],
  source: {
    channel: "web",
  },
  ai: {
    classification_confirmed: true,
    interview_used: false,
  },
};

export default async function NewFragmentPage() {
  const fragments = await listFragments();

  const domains = Object.entries(domainsConfig.domains).map(([id, value]) => ({
    id,
    label: value.label,
  }));

  const options = fragments.map((fragment) => ({
    id: fragment.id,
    title: fragment.title,
    type: fragment.type,
  }));

  return (
    <main className="pageShell">
      <section className="pageHeader">
        <div>
          <p className="eyebrow">Manual capture</p>
          <h1>手動新增 Fragment</h1>
          <p className="subtle">
            不呼叫 AI。Phase 4 只建立並檢查草稿，Phase 5 才會正式寫入 GitHub。
          </p>
        </div>
      </section>

      <FragmentForm
        mode="new"
        initial={initial}
        domains={domains}
        fragments={options}
        remoteConfigured={isGitHubRemoteConfigured()}
      />
    </main>
  );
}
