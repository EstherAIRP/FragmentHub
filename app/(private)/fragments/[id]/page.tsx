import Link from "next/link";
import { notFound } from "next/navigation";

import { listFragments } from "@/lib/fragments";
import {
  formatTimestamp,
  levelLabels,
  scopeLabels,
  statusLabels,
  typeLabels,
} from "@/lib/fragments/presentation";

type FragmentDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function FragmentDetailPage({
  params,
}: FragmentDetailPageProps) {
  const { id } = await params;
  const fragments = await listFragments();
  const fragment = fragments.find((item) => item.id === id);

  if (!fragment) notFound();

  const byId = new Map(fragments.map((item) => [item.id, item]));
  const related = fragment.related
    .map((relatedId) => byId.get(relatedId))
    .filter((item) => item !== undefined);
  const backlinks = fragments.filter(
    (item) => item.id !== id && item.related.includes(id),
  );
  const children =
    fragment.type === "project"
      ? fragments.filter((item) => item.project === id)
      : [];
  const project = fragment.project ? byId.get(fragment.project) : undefined;

  return (
    <main className="pageShell">
      <section className="detailHeader">
        <div>
          <div className="fragmentMeta">
            <span>{fragment.id}</span>
            <span>{scopeLabels[fragment.scope]}</span>
            <span>{typeLabels[fragment.type]}</span>
            <span>{statusLabels[fragment.status]}</span>
          </div>
          <h1>{fragment.title}</h1>
          <p className="heroCopy">{fragment.summary || "尚未填寫摘要。"}</p>
        </div>

        <div className="detailActions">
          <Link
            className="secondaryButton linkButton"
            href={`/fragments/${fragment.id}/edit`}
          >
            編輯
          </Link>
          {fragment.status !== "archived" ? (
            <Link
              className="dangerButton linkButton"
              href={`/fragments/${fragment.id}/edit?archive=1`}
            >
              Archive
            </Link>
          ) : null}
        </div>
      </section>

      <section className="detailGrid">
        <div className="detailMain">
          <article className="panel detailSection">
            <p className="eyebrow">Content</p>
            <h2>內容</h2>

            <dl className="detailList">
              <div>
                <dt>Next action</dt>
                <dd>{fragment.next_action || "—"}</dd>
              </div>
              <div>
                <dt>Notes</dt>
                <dd className="preserveText">{fragment.notes || "—"}</dd>
              </div>
              <div>
                <dt>Original input</dt>
                <dd className="preserveText">{fragment.original_input}</dd>
              </div>
            </dl>
          </article>

          {fragment.interview.length > 0 ? (
            <article className="panel detailSection">
              <p className="eyebrow">Interview</p>
              <h2>提問紀錄</h2>
              <div className="interviewList">
                {fragment.interview.map((item, index) => (
                  <div key={`${index}-${item.question}`}>
                    <strong>Q{index + 1}. {item.question}</strong>
                    <p>{item.answer}</p>
                  </div>
                ))}
              </div>
            </article>
          ) : null}

          {(children.length > 0 || related.length > 0 || backlinks.length > 0) ? (
            <article className="panel detailSection">
              <p className="eyebrow">Relations</p>
              <h2>關聯</h2>

              {children.length > 0 ? (
                <RelationGroup title="Project children" items={children} />
              ) : null}
              {related.length > 0 ? (
                <RelationGroup title="Related" items={related} />
              ) : null}
              {backlinks.length > 0 ? (
                <RelationGroup title="Backlinks" items={backlinks} />
              ) : null}
            </article>
          ) : null}
        </div>

        <aside className="panel detailSidebar">
          <p className="eyebrow">Metadata</p>
          <h2>資料</h2>

          <dl className="metadataList">
            <div>
              <dt>Priority</dt>
              <dd>{levelLabels[fragment.priority]}</dd>
            </div>
            <div>
              <dt>Urgency</dt>
              <dd>{levelLabels[fragment.urgency]}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatTimestamp(fragment.created_at)}</dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>{formatTimestamp(fragment.updated_at)}</dd>
            </div>
            <div>
              <dt>Source</dt>
              <dd>{fragment.source.channel}</dd>
            </div>
            <div>
              <dt>Project</dt>
              <dd>
                {project ? (
                  <Link href={`/fragments/${project.id}`}>
                    {project.id} · {project.title}
                  </Link>
                ) : (
                  "—"
                )}
              </dd>
            </div>
          </dl>

          <div className="sidebarGroup">
            <strong>Domains</strong>
            <div className="tags">
              {fragment.domains.length > 0
                ? fragment.domains.map((domain) => (
                    <span className="domainChip" key={domain}>
                      {domain}
                    </span>
                  ))
                : "—"}
            </div>
          </div>

          <div className="sidebarGroup">
            <strong>Tags</strong>
            <div className="tags">
              {fragment.tags.length > 0
                ? fragment.tags.map((tag) => <span key={tag}>#{tag}</span>)
                : "—"}
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

function RelationGroup({
  title,
  items,
}: {
  title: string;
  items: Array<{ id: string; title: string; type: string }>;
}) {
  return (
    <div className="relationGroup">
      <strong>{title}</strong>
      <div className="relationCards">
        {items.map((item) => (
          <Link href={`/fragments/${item.id}`} key={item.id}>
            <span>{item.id}</span>
            <strong>{item.title}</strong>
            <small>{item.type}</small>
          </Link>
        ))}
      </div>
    </div>
  );
}
