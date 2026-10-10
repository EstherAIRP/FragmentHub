import Link from "next/link";

import { BoardCard } from "@/components/board-card";
import { requireSession } from "@/lib/auth";
import { listFragments } from "@/lib/fragments";
import {
  activeSoftLimit,
  boardColumns,
  countRecentlyDone,
  filterByScope,
  groupBoard,
  listIncubating,
  parseBoardScope,
  type BoardScope,
} from "@/lib/fragments/board";
import { statusLabels } from "@/lib/fragments/presentation";
import { isGitHubRemoteConfigured } from "@/lib/github/availability";

type BoardView = "board" | "incubating";

type BoardPageProps = {
  searchParams: Promise<{
    view?: string;
    scope?: string;
  }>;
};

const scopeTabs: { value: BoardScope; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "work", label: "工作" },
  { value: "personal", label: "個人" },
];

const viewTabs: { value: BoardView; label: string }[] = [
  { value: "board", label: "看板" },
  { value: "incubating", label: "醞釀中" },
];

function homeHref(view: BoardView, scope: BoardScope) {
  const params = new URLSearchParams();
  if (view !== "board") params.set("view", view);
  if (scope !== "all") params.set("scope", scope);

  const query = params.toString();
  return query ? `/?${query}` : "/";
}

function doneHref(scope: BoardScope) {
  const params = new URLSearchParams({ status: "done" });
  if (scope !== "all") params.set("scope", scope);
  return `/fragments?${params.toString()}`;
}

export default async function BoardPage({ searchParams }: BoardPageProps) {
  await requireSession();

  const [allFragments, query] = await Promise.all([
    listFragments(),
    searchParams,
  ]);

  const view: BoardView = query.view === "incubating" ? "incubating" : "board";
  const scope = parseBoardScope(query.scope);
  const fragments = filterByScope(allFragments, scope);
  const remoteConfigured = isGitHubRemoteConfigured();
  const showScope = scope === "all";

  return (
    <main className="pageShell">
      <section className="boardHeader">
        <h1>看板</h1>

        <div className="boardControls">
          <nav className="boardTabs" aria-label="檢視">
            {viewTabs.map((tab) => (
              <Link
                key={tab.value}
                href={homeHref(tab.value, scope)}
                aria-current={view === tab.value ? "page" : undefined}
              >
                {tab.label}
              </Link>
            ))}
          </nav>

          <nav className="boardTabs" aria-label="範圍">
            {scopeTabs.map((tab) => (
              <Link
                key={tab.value}
                href={homeHref(view, tab.value)}
                aria-current={scope === tab.value ? "page" : undefined}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      {view === "board" ? (
        <BoardColumns
          fragments={fragments}
          scope={scope}
          showScope={showScope}
          remoteConfigured={remoteConfigured}
        />
      ) : (
        <IncubatingList
          fragments={fragments}
          showScope={showScope}
          remoteConfigured={remoteConfigured}
        />
      )}
    </main>
  );
}

type SectionProps = {
  fragments: Parameters<typeof groupBoard>[0];
  showScope: boolean;
  remoteConfigured: boolean;
};

function BoardColumns({
  fragments,
  scope,
  showScope,
  remoteConfigured,
}: SectionProps & { scope: BoardScope }) {
  const columns = groupBoard(fragments);
  const recentlyDone = countRecentlyDone(fragments, new Date());

  return (
    <>
      <div className="boardGrid">
        {boardColumns.map((status) => {
          const cards = columns[status];
          const headingId = `board-column-${status}`;

          return (
            <section
              className="boardColumn"
              key={status}
              aria-labelledby={headingId}
            >
              <header className="boardColumnHeader">
                <h2 id={headingId}>
                  {statusLabels[status]}
                  <span className="boardCount">{cards.length}</span>
                </h2>
                {status === "active" && cards.length > activeSoftLimit ? (
                  <p className="boardHint">
                    超過 {activeSoftLimit} 件，考慮先收尾
                  </p>
                ) : null}
              </header>

              {cards.length === 0 ? (
                <p className="boardEmpty">目前沒有項目</p>
              ) : (
                <div className="boardCards">
                  {cards.map((fragment) => (
                    <BoardCard
                      key={fragment.id}
                      fragment={fragment}
                      showScope={showScope}
                      remoteConfigured={remoteConfigured}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <p className="boardFooter">
        <Link className="textLink" href={doneHref(scope)}>
          近 7 天完成 {recentlyDone} 件 →
        </Link>
      </p>
    </>
  );
}

function IncubatingList({
  fragments,
  showScope,
  remoteConfigured,
}: SectionProps) {
  const items = listIncubating(fragments);

  return (
    <section className="incubatingList" aria-label={statusLabels.incubating}>
      {items.length === 0 ? (
        <p className="boardEmpty">
          目前沒有醞釀中的想法。還沒準備好開始的想法可以先放在這裡。
        </p>
      ) : (
        items.map((fragment) => (
          <BoardCard
            key={fragment.id}
            fragment={fragment}
            showScope={showScope}
            remoteConfigured={remoteConfigured}
          />
        ))
      )}
    </section>
  );
}
