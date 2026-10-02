# FragmentHub GPT 分析層

> Phase：3 — GPT 分析層  
> 狀態：完成  
> 核心原則：AI 提案，人類確認；確認後 metadata 鎖定。

## 1. Phase 3 範圍

本階段完成：

- Classification Prompt
- Structured Output Schema
- Controlled Domain 輸出
- Metadata 建議
- Relation suggestion 檢查
- Human Confirm 狀態
- Dynamic Interview
- Final Record 文字整理
- Final Record Draft 組裝
- AI Layer 純邏輯測試

本階段**不寫入 GitHub**。真正 Save 仍需最終使用者確認，之後才由 Data Layer 執行。

## 2. 流程

```text
Raw Input
   ↓
POST /api/analyze
   ↓
GPT Classification Proposal
   ↓
User Edit
   ↓
confirmAnalysis()
   ↓
Confirmed Metadata
   ↓
      ┌──────── skip ────────┐
      │                      │
Interview?                No Interview
      │                      │
POST /api/interview          │
      │                      │
0–6 Q/A                      │
      └──────────┬───────────┘
                 ↓
         POST /api/finalize
                 ↓
       Final Fragment Draft
                 ↓
        Final Preview / Confirm
                 ↓
       Phase 4/5 Save Flow
```

## 3. Classification

Endpoint：

```text
POST /api/analyze
```

Request：

```json
{
  "input": "我想研究..."
}
```

Response：

```json
{
  "analysis": {
    "scope": "personal",
    "type": "learning",
    "status": "exploring",
    "priority": "medium",
    "urgency": "low",
    "domains": ["ai"],
    "tags": ["memory"],
    "project": null,
    "related": [],
    "title": "研究 AI 記憶方法",
    "summary": "...",
    "next_action": null,
    "notes": null,
    "domain_suggestion": null,
    "classification_reason": "..."
  },
  "warnings": [],
  "model": "gpt-5.6-terra",
  "requires_confirmation": true
}
```

### 3.1 Domain

模型輸出的 `domains` 只能來自：

```text
config/domains.json
```

若現有 Domain 不足，模型不能直接建立新 Domain，而是在：

```text
domain_suggestion
```

提出建議。

`domain_suggestion` 不是 Canonical Fragment 欄位，不會自動寫入正式資料。

### 3.2 Relation

Classification 可以建議：

- `project`
- `related`

但模型只能從提供的既有 Fragment context 選 ID。

模型輸出後仍會由 `sanitizeAnalysisRelations()` 檢查：

- ID 是否存在
- project target 是否為 project

非法建議會被移除並回傳 warning。

## 4. Human Confirm

AI 分析結果不是正式資料。

確認：

```ts
const confirmed = confirmAnalysis(analysis);
```

才會得到：

```json
{
  "...": "...",
  "confirmed": true
}
```

Interview 與 Finalize API 都只接受 `confirmed: true`。

如果使用者重新修改分類：

```ts
reopenConfirmedAnalysis(confirmed)
```

會移除 confirm state，需要重新確認。

## 5. Interview

Endpoint：

```text
POST /api/interview
```

Request：

```json
{
  "original_input": "...",
  "analysis": {
    "...": "...",
    "confirmed": true
  },
  "interview": []
}
```

模型每次只做一件事：

- 提出下一個問題；或
- 判斷資訊已足夠並結束。

Response：

```json
{
  "decision": {
    "complete": false,
    "question": "這件事什麼條件算完成？",
    "focus": "done-definition",
    "completion_reason": "仍缺少完成條件。"
  }
}
```

限制：

- 一次只問一題。
- 不重複已回答內容。
- 不為填欄位而問。
- v0.1 最多 6 題。
- 第 6 題完成後不再呼叫模型產生第 7 題。

## 6. Finalize

Endpoint：

```text
POST /api/finalize
```

Finalizer **沒有權限改分類**。

GPT 只生成：

```text
title
summary
next_action
notes
```

以下欄位由程式從 confirmed analysis 原樣保留：

```text
scope
type
status
priority
urgency
domains
tags
project
related
```

`original_input` 也由程式直接帶入，不交給模型重寫。

Response：

```json
{
  "draft": {
    "schema_version": "0.1",
    "scope": "personal",
    "type": "idea",
    "...": "...",
    "source": {
      "channel": "web"
    },
    "ai": {
      "classification_confirmed": true,
      "interview_used": true
    }
  },
  "requires_final_confirmation": true
}
```

Draft 尚未包含：

```text
id
created_at
updated_at
```

這三項只應在最終確認後，由 Phase 2 Data Layer 建立正式 Fragment 時產生。

## 7. Prompt Source

可執行 Prompt 位於：

```text
lib/ai/prompts.ts
```

它直接引用：

```text
config/classification.json
config/domains.json
```

因此規格異動不需要另外維護一份硬編碼分類 Prompt。

## 8. OpenAI Structured Output

AI 呼叫統一經：

```text
lib/ai/openai.ts
```

功能：

- Responses API
- `text.format.type = json_schema`
- `strict = true`
- refusal 處理
- incomplete response 處理
- JSON parse error 處理

OpenAI API schema 與 Canonical Fragment Schema 刻意分開：

- API schema：只負責限制模型可輸出的形狀。
- Zod / Semantic Validation：負責完整應用規則。
- Canonical JSON Schema：負責正式 Fragment 資料。

## 9. Phase 3 / Phase 4 邊界

Phase 3 提供完整 AI workflow 能力與 API。

Phase 4 才負責把這些能力做成完整 Web MVP，包括：

- 分析結果完整 UI
- Domain selector
- Relation selector
- Interview 對話 UI
- Final Preview UI
- Authentication
- List / Detail / Search / Filter
