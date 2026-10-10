import Link from "next/link";

import { StatusMoveMenu } from "@/components/status-move-menu";
import type { Fragment } from "@/lib/fragment-schema";
import {
  domainLabel,
  levelLabels,
  scopeLabels,
} from "@/lib/fragments/presentation";
import { buildStatusMoveDraft } from "@/lib/fragments/status-move";

const priorityClass = {
  high: "boardPriority levelHigh",
  medium: "boardPriority levelMedium",
} as const;

type BoardCardProps = {
  fragment: Fragment;
  showScope: boolean;
  remoteConfigured: boolean;
};

export function BoardCard({
  fragment,
  showScope,
  remoteConfigured,
}: BoardCardProps) {
  const move = buildStatusMoveDraft(fragment);
  const disabledReason = !remoteConfigured
    ? "GitHub Remote Store 尚未設定"
    : move.ok
      ? undefined
      : move.reason;
  const priority = fragment.priority;

  return (
    <article className="boardCard">
      <h3>
        <Link className="cardLink" href={`/fragments/${fragment.id}`}>
          {fragment.title}
        </Link>
      </h3>

      {fragment.next_action ? (
        <p className="boardNextAction" title={fragment.next_action}>
          下一步：{fragment.next_action}
        </p>
      ) : null}

      <div className="boardCardFooter">
        <div className="boardMeta">
          {priority === "high" || priority === "medium" ? (
            <span className={priorityClass[priority]}>
              <span className="boardDot" aria-hidden="true" />
              優先 {levelLabels[priority]}
            </span>
          ) : null}
          {fragment.domains.slice(0, 2).map((domain) => (
            <span className="boardDomain" key={domain}>
              {domainLabel(domain)}
            </span>
          ))}
          {showScope ? (
            <span className="boardScope">{scopeLabels[fragment.scope]}</span>
          ) : null}
        </div>

        <StatusMoveMenu
          id={fragment.id}
          title={fragment.title}
          status={fragment.status}
          updatedAt={fragment.updated_at}
          draft={move.ok ? move.draft : null}
          disabledReason={disabledReason}
        />
      </div>
    </article>
  );
}
