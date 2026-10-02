"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  manualFragmentDraftSchema,
  toFragmentWriteInput,
  type ManualFragmentDraft,
} from "@/lib/fragments/manual-draft";
import {
  levelLabels,
  scopeLabels,
  statusLabels,
  typeLabels,
} from "@/lib/fragments/presentation";

type Option = {
  id: string;
  label: string;
};

type FragmentOption = {
  id: string;
  title: string;
  type: string;
};

type ExistingMeta = {
  id: string;
  created_at: string;
  updated_at: string;
};

type FragmentFormProps = {
  mode: "new" | "edit";
  initial: ManualFragmentDraft;
  domains: Option[];
  fragments: FragmentOption[];
  remoteConfigured: boolean;
  existingMeta?: ExistingMeta;
};

type SaveResponse = {
  fragment?: {
    id: string;
    updated_at: string;
  };
  error?: string;
};

function nullable(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
}

function csv(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value : "";
  return Array.from(
    new Set(
      text
        .split(",")
        .map((item) =>
          item
            .trim()
            .toLowerCase()
            .replace(/[_\s]+/g, "-")
            .replace(/-+/g, "-"),
        )
        .filter(Boolean),
    ),
  );
}

export function FragmentForm({
  mode,
  initial,
  domains,
  fragments,
  remoteConfigured,
  existingMeta,
}: FragmentFormProps) {
  const router = useRouter();
  const [previewDraft, setPreviewDraft] =
    useState<ManualFragmentDraft | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(initial.status);

  function buildPreview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const candidate = {
      scope: form.get("scope"),
      type: form.get("type"),
      status,
      priority: form.get("priority"),
      urgency: form.get("urgency"),
      domains: form.getAll("domains").map(String),
      tags: csv(form.get("tags")),
      project: nullable(form.get("project")),
      related: form.getAll("related").map(String),
      title: String(form.get("title") ?? ""),
      summary: String(form.get("summary") ?? ""),
      next_action: nullable(form.get("next_action")),
      original_input: String(form.get("original_input") ?? ""),
      notes: nullable(form.get("notes")),
      interview: initial.interview,
      source: initial.source,
      ai: {
        classification_confirmed: true,
        interview_used: initial.interview.length > 0,
      },
    };

    const parsed = manualFragmentDraftSchema.safeParse(candidate);

    if (!parsed.success) {
      setPreviewDraft(null);
      setSaveError(null);
      setErrors(
        parsed.error.issues.map((issue) => {
          const path = issue.path.join(".") || "fragment";
          return `${path}: ${issue.message}`;
        }),
      );
      return;
    }

    setErrors([]);
    setSaveError(null);
    setPreviewDraft(parsed.data);
  }

  async function saveDraft() {
    if (!previewDraft || !remoteConfigured || saving) return;

    setSaving(true);
    setSaveError(null);

    try {
      const endpoint =
        mode === "edit" && existingMeta
          ? `/api/fragments/${existingMeta.id}`
          : "/api/fragments";

      const response = await fetch(endpoint, {
        method: mode === "edit" ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          mode === "edit" && existingMeta
            ? {
                draft: previewDraft,
                expected_updated_at: existingMeta.updated_at,
              }
            : {
                draft: previewDraft,
              },
        ),
      });

      const payload = (await response.json()) as SaveResponse;

      if (!response.ok || !payload.fragment) {
        throw new Error(payload.error ?? "GitHub 儲存失敗。");
      }

      router.push(`/fragments/${payload.fragment.id}`);
      router.refresh();
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "GitHub 儲存失敗。",
      );
    } finally {
      setSaving(false);
    }
  }

  const preview = previewDraft
    ? JSON.stringify(
        mode === "edit" && existingMeta
          ? {
              id: existingMeta.id,
              created_at: existingMeta.created_at,
              updated_at: "(儲存時更新)",
              ...toFragmentWriteInput(previewDraft),
            }
          : {
              id: "(儲存時配發)",
              created_at: "(儲存時產生)",
              updated_at: "(儲存時產生)",
              ...toFragmentWriteInput(previewDraft),
            },
        null,
        2,
      )
    : null;

  return (
    <div className="editorLayout">
      <form
        className="fragmentEditor"
        onSubmit={buildPreview}
        onChange={() => {
          setPreviewDraft(null);
          setSaveError(null);
        }}
      >
        <div className="editorSection">
          <div className="sectionHeading">
            <div>
              <p className="eyebrow">Classification</p>
              <h2>分類</h2>
            </div>
            <span className="muted">全部由你手動決定，不呼叫 AI</span>
          </div>

          <div className="fieldGrid">
            <label>
              <span>Scope</span>
              <select name="scope" defaultValue={initial.scope}>
                {Object.entries(scopeLabels).map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Type</span>
              <select name="type" defaultValue={initial.type}>
                {Object.entries(typeLabels).map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Status</span>
              <select
                name="status"
                value={status}
                onChange={(event) => {
                  setStatus(
                    event.target.value as ManualFragmentDraft["status"],
                  );
                  setPreviewDraft(null);
                }}
              >
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Priority</span>
              <select name="priority" defaultValue={initial.priority}>
                {Object.entries(levelLabels).map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Urgency</span>
              <select name="urgency" defaultValue={initial.urgency}>
                {Object.entries(levelLabels).map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="editorSection">
          <div className="sectionHeading">
            <div>
              <p className="eyebrow">Content</p>
              <h2>內容</h2>
            </div>
          </div>

          <label className="wideField">
            <span>Title</span>
            <input name="title" defaultValue={initial.title} required />
          </label>

          <label className="wideField">
            <span>Summary</span>
            <textarea
              name="summary"
              defaultValue={initial.summary}
              rows={4}
            />
          </label>

          <label className="wideField">
            <span>Next action</span>
            <input
              name="next_action"
              defaultValue={initial.next_action ?? ""}
            />
          </label>

          <label className="wideField">
            <span>Original input</span>
            <textarea
              name="original_input"
              defaultValue={initial.original_input}
              rows={5}
              readOnly={mode === "edit"}
              required
            />
            {mode === "edit" ? (
              <small>
                依資料規格，既有 Fragment 的 original_input 不直接改寫。
              </small>
            ) : null}
          </label>

          <label className="wideField">
            <span>Notes</span>
            <textarea
              name="notes"
              defaultValue={initial.notes ?? ""}
              rows={4}
            />
          </label>
        </div>

        <div className="editorSection">
          <div className="sectionHeading">
            <div>
              <p className="eyebrow">Metadata</p>
              <h2>Domain 與 Tag</h2>
            </div>
          </div>

          <fieldset className="choiceGroup">
            <legend>Domains</legend>
            <div className="checkboxGrid">
              {domains.map((domain) => (
                <label className="checkboxCard" key={domain.id}>
                  <input
                    type="checkbox"
                    name="domains"
                    value={domain.id}
                    defaultChecked={initial.domains.includes(domain.id)}
                  />
                  <span>
                    <strong>{domain.label}</strong>
                    <small>{domain.id}</small>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="wideField">
            <span>Tags</span>
            <input
              name="tags"
              defaultValue={initial.tags.join(", ")}
              placeholder="ocr, workflow, memory"
            />
            <small>以逗號分隔；會轉成小寫 kebab-case 格式。</small>
          </label>
        </div>

        <div className="editorSection">
          <div className="sectionHeading">
            <div>
              <p className="eyebrow">Relations</p>
              <h2>關聯</h2>
            </div>
          </div>

          <label className="wideField">
            <span>Project</span>
            <select name="project" defaultValue={initial.project ?? ""}>
              <option value="">無</option>
              {fragments
                .filter((fragment) => fragment.type === "project")
                .map((fragment) => (
                  <option value={fragment.id} key={fragment.id}>
                    {fragment.id} · {fragment.title}
                  </option>
                ))}
            </select>
          </label>

          <fieldset className="choiceGroup">
            <legend>Related</legend>
            {fragments.length === 0 ? (
              <p className="muted">目前沒有其他 Fragment 可建立關聯。</p>
            ) : (
              <div className="relationList">
                {fragments.map((fragment) => (
                  <label className="relationOption" key={fragment.id}>
                    <input
                      type="checkbox"
                      name="related"
                      value={fragment.id}
                      defaultChecked={initial.related.includes(fragment.id)}
                    />
                    <span>{fragment.id}</span>
                    <strong>{fragment.title}</strong>
                  </label>
                ))}
              </div>
            )}
          </fieldset>
        </div>

        {errors.length > 0 ? (
          <div className="notice danger">
            <strong>草稿尚未通過檢查</strong>
            <ul>
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="editorActions">
          {mode === "edit" && status !== "archived" ? (
            <button
              className="dangerButton"
              type="button"
              onClick={() => {
                setStatus("archived");
                setPreviewDraft(null);
              }}
            >
              設為 Archived
            </button>
          ) : null}

          <button className="primaryButton" type="submit">
            檢查並預覽 JSON
          </button>
        </div>
      </form>

      <aside className="draftPreview">
        <div className="sectionHeading">
          <div>
            <p className="eyebrow">Final preview</p>
            <h2>待儲存 JSON</h2>
          </div>
        </div>

        {preview ? (
          <>
            <pre>{preview}</pre>

            {!remoteConfigured ? (
              <div className="notice danger">
                <strong>GitHub Remote Store 尚未設定</strong>
                <p>
                  需要在 Vercel 設定 FRAGMENTHUB_GITHUB_TOKEN 後才能正式儲存。
                </p>
              </div>
            ) : null}

            {saveError ? (
              <div className="notice danger">
                <strong>儲存失敗</strong>
                <p>{saveError}</p>
              </div>
            ) : null}

            <button
              className="primaryButton saveButton"
              type="button"
              disabled={!remoteConfigured || saving}
              onClick={saveDraft}
            >
              {saving
                ? "正在寫入 GitHub…"
                : mode === "edit"
                  ? "確認並更新 GitHub"
                  : "確認並建立 Fragment"}
            </button>
          </>
        ) : (
          <div className="previewEmpty">
            填寫表單後按「檢查並預覽 JSON」，確認內容後才會出現 GitHub 儲存按鈕。
          </div>
        )}
      </aside>
    </div>
  );
}
