import Link from "next/link";

import { FragmentCard } from "@/components/fragment-card";
import { listFragments } from "@/lib/fragments";

export default async function DashboardPage() {
  const fragments = await listFragments();

  const stats = {
    total: fragments.length,
    active: fragments.filter((item) => item.status === "active").length,
    waiting: fragments.filter((item) => item.status === "waiting").length,
    actionable: fragments.filter((item) => item.status === "actionable").length,
    work: fragments.filter((item) => item.scope === "work").length,
    personal: fragments.filter((item) => item.scope === "personal").length,
  };

  return (
    <main className="pageShell">
      <section className="dashboardHero">
        <div>
          <p className="eyebrow">FragmentHub · Web MVP</p>
          <h1>你的碎片，集中在同一個資料池。</h1>
          <p className="heroCopy">
            Web 不執行 AI 分析；這裡只負責瀏覽、搜尋、篩選與手動管理 GitHub Fragment。
          </p>
        </div>

        <div className="heroActions">
          <Link className="primaryButton linkButton" href="/fragments/new">
            手動新增 Fragment
          </Link>
          <Link className="secondaryButton linkButton" href="/fragments">
            瀏覽全部
          </Link>
        </div>
      </section>

      <section className="stats" aria-label="Fragment 統計">
        <article>
          <span>全部</span>
          <strong>{stats.total}</strong>
        </article>
        <article>
          <span>Actionable</span>
          <strong>{stats.actionable}</strong>
        </article>
        <article>
          <span>Active</span>
          <strong>{stats.active}</strong>
        </article>
        <article>
          <span>Waiting</span>
          <strong>{stats.waiting}</strong>
        </article>
        <article>
          <span>工作</span>
          <strong>{stats.work}</strong>
        </article>
        <article>
          <span>個人</span>
          <strong>{stats.personal}</strong>
        </article>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <p className="eyebrow">Recent</p>
            <h2>最近更新</h2>
          </div>
          <Link className="textLink" href="/fragments">
            查看全部
          </Link>
        </div>

        {fragments.length === 0 ? (
          <div className="emptyState">
            <strong>目前還沒有正式 Fragment。</strong>
            <p>
              你可以在 ChatGPT 完成整理後寫入 GitHub，或先使用 Web 的手動新增表單準備草稿。
            </p>
          </div>
        ) : (
          <div className="fragmentList">
            {fragments.slice(0, 6).map((fragment) => (
              <FragmentCard fragment={fragment} key={fragment.id} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
