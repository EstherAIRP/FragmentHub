"use client";

import { useState } from "react";

import type { FragmentAnalysis } from "@/lib/analysis-schema";

const scopeOptions = [
  ["personal", "個人"],
  ["work", "工作"],
] as const;

const typeOptions = [
  ["idea", "靈感"],
  ["task", "待辦"],
  ["learning", "學習"],
  ["requirement", "需求"],
  ["project", "專案"],
  ["question", "問題"],
  ["decision", "決策"],
  ["tracking", "追蹤"],
  ["resource", "資源"],
  ["note", "紀錄"],
] as const;

const statusOptions = [
  ["inbox", "Inbox"],
  ["seed", "Seed"],
  ["exploring", "Exploring"],
  ["defined", "Defined"],
  ["actionable", "Actionable"],
  ["active", "Active"],
  ["waiting", "Waiting"],
  ["done", "Done"],
  ["archived", "Archived"],
] as const;

const levelOptions = [
  ["high", "High"],
  ["medium", "Medium"],
  ["low", "Low"],
  ["none", "None"],
] as const;

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function CapturePanel() {
  const [input, setInput] = useState("");
  const [analysis, setAnalysis] = useState<FragmentAnalysis | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyze() {
    if (!input.trim()) return;

    setLoading(true);
    setError(null);
    setConfirmed(false);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input }),
      });

      const payload = (await response.json()) as {
        analysis?: FragmentAnalysis;
        model?: string;
        error?: string;
      };

      if (!response.ok || !payload.analysis) {
        throw new Error(payload.error ?? "AI 預分析失敗。");
      }

      setAnalysis(payload.analysis);
      setModel(payload.model ?? null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "AI 預分析失敗。");
    } finally {
      setLoading(false);
    }
  }

  function update<K extends keyof FragmentAnalysis>(
    key: K,
    value: FragmentAnalysis[K],
  ) {
    setConfirmed(false);
    setAnalysis((current) =>
      current ? { ...current, [key]: value } : current,
    );
  }

  function reset() {
    setAnalysis(null);
    setModel(null);
    setConfirmed(false);
    setError(null);
  }

  return (
    <section className="captureFlow">
      <div className="captureEditor">
        <label htmlFor="fragment-input">現在腦中有什麼？</label>
        <textarea
          id="fragment-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="工作待辦、突然想到的點子、想研究的東西，都可以直接寫……"
          rows={6}
        />
        <div className="captureActions">
          <span>這一步只做預分析，不會寫入 GitHub。</span>
          <button
            className="primaryButton"
            type="button"
            onClick={analyze}
            disabled={loading || !input.trim()}
          >
            {loading ? "分析中…" : "交給 GPT 分析"}
          </button>
        </div>
        {error ? <p className="errorMessage">{error}</p> : null}
      </div>

      {analysis ? (
        <div className="analysisPanel">
          <div className="analysisHeading">
            <div>
              <p className="eyebrow">Proposed classification</p>
              <h2>GPT 預分析</h2>
            </div>
            {model ? <span className="muted">{model}</span> : null}
          </div>

          <div className="fieldGrid">
            <label>
              <span>Scope</span>
              <select
                value={analysis.scope}
                onChange={(event) =>
                  update(
                    "scope",
                    event.target.value as FragmentAnalysis["scope"],
                  )
                }
              >
                {scopeOptions.map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Type</span>
              <select
                value={analysis.type}
                onChange={(event) =>
                  update(
                    "type",
                    event.target.value as FragmentAnalysis["type"],
                  )
                }
              >
                {typeOptions.map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Status</span>
              <select
                value={analysis.status}
                onChange={(event) =>
                  update(
                    "status",
                    event.target.value as FragmentAnalysis["status"],
                  )
                }
              >
                {statusOptions.map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Priority</span>
              <select
                value={analysis.priority}
                onChange={(event) =>
                  update(
                    "priority",
                    event.target.value as FragmentAnalysis["priority"],
                  )
                }
              >
                {levelOptions.map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Urgency</span>
              <select
                value={analysis.urgency}
                onChange={(event) =>
                  update(
                    "urgency",
                    event.target.value as FragmentAnalysis["urgency"],
                  )
                }
              >
                {levelOptions.map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="wideField">
            <span>Title</span>
            <input
              value={analysis.title}
              onChange={(event) => update("title", event.target.value)}
            />
          </label>

          <label className="wideField">
            <span>Summary</span>
            <textarea
              rows={3}
              value={analysis.summary}
              onChange={(event) => update("summary", event.target.value)}
            />
          </label>

          <div className="fieldGrid twoColumns">
            <label>
              <span>Domains（逗號分隔）</span>
              <input
                value={analysis.domains.join(", ")}
                onChange={(event) =>
                  update("domains", splitList(event.target.value))
                }
              />
            </label>

            <label>
              <span>Tags（逗號分隔）</span>
              <input
                value={analysis.tags.join(", ")}
                onChange={(event) =>
                  update("tags", splitList(event.target.value))
                }
              />
            </label>
          </div>

          <label className="wideField">
            <span>Next action</span>
            <input
              value={analysis.next_action ?? ""}
              onChange={(event) =>
                update("next_action", event.target.value || null)
              }
            />
          </label>

          <div className="reasonBox">
            <strong>判斷摘要</strong>
            <p>{analysis.classification_reason}</p>
          </div>

          {!confirmed ? (
            <div className="reviewActions">
              <button className="ghostButton" type="button" onClick={reset}>
                重新分析
              </button>
              <button
                className="primaryButton"
                type="button"
                onClick={() => setConfirmed(true)}
              >
                確認這份分類
              </button>
            </div>
          ) : (
            <div className="interviewPrompt">
              <div>
                <strong>分類已確認。</strong>
                <p>下一步要不要進入「提問紀錄模式」補完整內容？</p>
              </div>
              <div className="reviewActions">
                <button className="ghostButton" type="button" disabled>
                  跳過，準備寫入
                </button>
                <button className="primaryButton" type="button" disabled>
                  進入提問模式
                </button>
              </div>
              <small>
                這兩個動作會在 Phase 3 / 4 接上；目前不會寫入 GitHub。
              </small>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
