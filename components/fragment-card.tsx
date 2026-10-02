import Link from "next/link";

import type { Fragment } from "@/lib/fragment-schema";
import {
  formatTimestamp,
  scopeLabels,
  statusLabels,
  typeLabels,
} from "@/lib/fragments/presentation";

export function FragmentCard({ fragment }: { fragment: Fragment }) {
  return (
    <article className="fragmentCard">
      <div className="fragmentMeta">
        <span>{fragment.id}</span>
        <span>{scopeLabels[fragment.scope]}</span>
        <span>{typeLabels[fragment.type]}</span>
        <span>{statusLabels[fragment.status]}</span>
      </div>

      <div className="cardHeading">
        <h3>
          <Link href={`/fragments/${fragment.id}`}>{fragment.title}</Link>
        </h3>
        <time>{formatTimestamp(fragment.updated_at)}</time>
      </div>

      <p>{fragment.summary || "尚未填寫摘要。"}</p>

      <div className="tags">
        {fragment.domains.map((domain) => (
          <span className="domainChip" key={domain}>
            {domain}
          </span>
        ))}
        {fragment.tags.slice(0, 6).map((tag) => (
          <span key={tag}>#{tag}</span>
        ))}
      </div>
    </article>
  );
}
