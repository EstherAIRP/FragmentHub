import { listFragments } from "@/lib/fragments";

const typeLabels: Record<string, string> = {
  idea: "靈感",
  task: "待辦",
  learning: "學習",
  requirement: "需求",
  project: "專案",
  question: "問題",
  decision: "決策",
  tracking: "追蹤",
  resource: "資源",
  note: "紀錄",
};

export default async function Home() {
  const fragments = await listFragments();

  const workCount = fragments.filter((item) => item.scope === "work").length;
  const personalCount = fragments.filter(
    (item) => item.scope === "personal",
  ).length;
  const activeCount = fragments.filter((item) =>
    ["actionable", "active", "waiting"].includes(item.status),
  ).length;

  return (
    <main className="shell">
      <header className="hero">
        <div>
          <p className="eyebrow">FragmentHub · v0.1</p>
          <h1>把零碎想法整理成可以繼續思考的東西。</h1>
          <p className="heroCopy">
            單一資料池，以 JSON 保存；GPT 提出分類與結構，人類做最後確認。
          </p>
        </div>
        <div className="captureBox">
          <span>快速捕捉</span>
          <p>網站輸入與 GPT 分析流程將在下一階段接上。</p>
          <button disabled>新增 Fragment</button>
        </div>
      </header>

      <section className="stats" aria-label="Fragment 統計">
        <article>
          <span>全部</span>
          <strong>{fragments.length}</strong>
        </article>
        <article>
          <span>工作</span>
          <strong>{workCount}</strong>
        </article>
        <article>
          <span>個人</span>
          <strong>{personalCount}</strong>
        </article>
        <article>
          <span>待行動／進行中</span>
          <strong>{activeCount}</strong>
        </article>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <p className="eyebrow">Fragments</p>
            <h2>最近紀錄</h2>
          </div>
          <span className="muted">資料來源：data/fragments/*.json</span>
        </div>

        {fragments.length === 0 ? (
          <div className="emptyState">
            <strong>目前還沒有 Fragment。</strong>
            <p>
              這是預期狀態。下一階段會加入「輸入 → GPT 預分析 → 確認 → 寫入」
              的正式流程。
            </p>
          </div>
        ) : (
          <div className="fragmentList">
            {fragments.slice(0, 20).map((fragment) => (
              <article className="fragmentCard" key={fragment.id}>
                <div className="fragmentMeta">
                  <span>{fragment.id}</span>
                  <span>{fragment.scope === "work" ? "工作" : "個人"}</span>
                  <span>{typeLabels[fragment.type] ?? fragment.type}</span>
                </div>
                <h3>{fragment.title}</h3>
                <p>{fragment.summary}</p>
                <div className="tags">
                  {fragment.tags.slice(0, 5).map((tag) => (
                    <span key={tag}>#{tag}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
