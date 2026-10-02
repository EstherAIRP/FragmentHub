import Link from "next/link";

import domainsConfig from "@/config/domains.json";
import { FragmentCard } from "@/components/fragment-card";
import { listFragments } from "@/lib/fragments";
import {
  collectTags,
  filterFragments,
  type FragmentFilters,
} from "@/lib/fragments/query";
import {
  levelLabels,
  scopeLabels,
  statusLabels,
  typeLabels,
} from "@/lib/fragments/presentation";

type FragmentsPageProps = {
  searchParams: Promise<FragmentFilters>;
};

export default async function FragmentsPage({
  searchParams,
}: FragmentsPageProps) {
  const [allFragments, filters] = await Promise.all([
    listFragments(),
    searchParams,
  ]);
  const fragments = filterFragments(allFragments, filters);
  const tags = collectTags(allFragments);

  return (
    <main className="pageShell">
      <section className="pageHeader">
        <div>
          <p className="eyebrow">Library</p>
          <h1>Fragments</h1>
          <p className="subtle">
            {fragments.length} / {allFragments.length} 筆符合目前條件
          </p>
        </div>
        <Link className="primaryButton linkButton" href="/fragments/new">
          手動新增
        </Link>
      </section>

      <section className="panel filterPanel">
        <form className="filterForm" method="get">
          <label className="searchField">
            <span>搜尋</span>
            <input
              name="q"
              defaultValue={filters.q ?? ""}
              placeholder="ID、標題、摘要、Domain、Tag"
            />
          </label>

          <label>
            <span>Scope</span>
            <select name="scope" defaultValue={filters.scope ?? ""}>
              <option value="">全部</option>
              {Object.entries(scopeLabels).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Type</span>
            <select name="type" defaultValue={filters.type ?? ""}>
              <option value="">全部</option>
              {Object.entries(typeLabels).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Status</span>
            <select name="status" defaultValue={filters.status ?? ""}>
              <option value="">全部</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Priority</span>
            <select name="priority" defaultValue={filters.priority ?? ""}>
              <option value="">全部</option>
              {Object.entries(levelLabels).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Urgency</span>
            <select name="urgency" defaultValue={filters.urgency ?? ""}>
              <option value="">全部</option>
              {Object.entries(levelLabels).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Domain</span>
            <select name="domain" defaultValue={filters.domain ?? ""}>
              <option value="">全部</option>
              {Object.entries(domainsConfig.domains).map(([id, value]) => (
                <option value={id} key={id}>
                  {value.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Tag</span>
            <input
              name="tag"
              defaultValue={filters.tag ?? ""}
              list="fragment-tags"
              placeholder="例如 ocr"
            />
            <datalist id="fragment-tags">
              {tags.map((tag) => (
                <option value={tag} key={tag} />
              ))}
            </datalist>
          </label>

          <div className="filterActions">
            <button className="primaryButton" type="submit">
              套用
            </button>
            <Link className="secondaryButton linkButton" href="/fragments">
              清除
            </Link>
          </div>
        </form>
      </section>

      <section className="fragmentList">
        {fragments.length === 0 ? (
          <div className="panel emptyState">
            <strong>找不到符合條件的 Fragment。</strong>
            <p>調整搜尋字詞或移除部分篩選條件。</p>
          </div>
        ) : (
          fragments.map((fragment) => (
            <FragmentCard fragment={fragment} key={fragment.id} />
          ))
        )}
      </section>
    </main>
  );
}
