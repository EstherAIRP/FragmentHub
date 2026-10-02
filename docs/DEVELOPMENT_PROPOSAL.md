# FragmentHub 開發提案

版本：v0.2  
狀態：開發中

## 1. 專案定位

FragmentHub 是一套私人碎片管理系統，用於收納生活、工作、學習、靈感、需求、決策與追蹤事項。

系統的核心不是自動替使用者做決策，而是：

> GPT 負責分析與提出結構，使用者負責最終決策。

## 2. 核心流程

```text
使用者提出內容
    ↓
GPT 依既定規則預分析
    ↓
回報分類、標籤、重要度、急迫度等結果
    ↓
討論與修改
    ↓
使用者確認
    ↓
詢問是否進入提問紀錄模式
    ↓
提問 / 跳過
    ↓
最終預覽
    ↓
使用者再次確認
    ↓
寫入 GitHub
```

GPT 不得在未確認的情況下自行修改既有 Fragment、提高優先度、自動合併、自動封存或重新分類。

## 3. Repository 策略

v0.1 採單一 Private Repository。

```text
FragmentHub/
├─ app/
├─ lib/
├─ config/
├─ data/
│  └─ fragments/
├─ generated/
└─ docs/
```

工作與私人資料不以路徑或 Repository 分離。

所有 Fragment 進入同一資料池：

```text
data/fragments/
```

並透過 metadata 區分。

## 4. Source of Truth

Fragment 使用 JSON 作為唯一正式資料格式。

```json
{
  "id": "F-000001",
  "scope": "personal",
  "type": "idea"
}
```

採 JSON 的理由：

- 與 Next.js / JavaScript / TypeScript 原生整合
- 適合 API 傳輸
- 適合 Schema 驗證
- 適合 GPT Structured Output
- 適合搜尋、篩選與排序
- 格式比 YAML 更嚴格，較適合程式資料

## 5. ID

所有 Fragment 使用統一永久 ID：

```text
F-000001
F-000002
F-000003
```

ID 不攜帶 work / personal 等分類語意。

分類可以修改，ID 不應因分類變更而改變。

## 6. Metadata

主要分類欄位：

- `scope`：生活範圍，例如 work / personal
- `type`：Fragment 本質
- `status`：目前成熟度或執行狀態
- `priority`：重要程度
- `urgency`：時間急迫性
- `domains`：可複選領域
- `tags`：自由細粒度標籤

### Type

- idea
- task
- learning
- requirement
- project
- question
- decision
- tracking
- resource
- note

### Status

- inbox
- seed
- exploring
- defined
- actionable
- active
- waiting
- done
- archived

## 7. 搜尋策略

JSON 與 YAML 的差異不是搜尋效能的主要瓶頸。

v0.1 可直接讀取 Fragment JSON；資料量增加後再產生：

```text
generated/index.json
```

索引只保存搜尋與列表所需欄位。

## 8. GitHub Actions

v0.1 不使用 GitHub Actions。

未來可能加入：

- JSON Schema 驗證
- 產生 index.json
- 關聯完整性檢查
- relations.json / stats.json
- 批次資料 migration
- 大量舊 Fragment 重新分析

Actions 僅在存在明確批次自動化需求時加入。

## 9. Web 與安全

Private Repository 不代表 Vercel 網站天然為私人。

因此：

- Fragment JSON 不放入 public/
- GitHub Token 與模型 API Key 不進前端
- GitHub / GPT 存取透過伺服器端執行
- 正式存入私人資料前，網站必須加入身分驗證

## 10. v0.1 開發階段

### Phase 1：基礎
- Repository 結構
- Fragment JSON Schema
- 分類規則
- TypeScript / Zod Runtime Schema
- 基礎 Dashboard

### Phase 2：捕捉與分析
- Quick Capture
- GPT 預分析
- 分類結果預覽
- 人工修改
- 確認狀態

### Phase 3：提問紀錄
- 動態提問
- 依 type 使用不同提問策略
- 最終資料預覽
- 再次確認

### Phase 4：GitHub 寫入
- 產生下一個 Fragment ID
- 建立 JSON
- GitHub API commit
- 編輯既有 Fragment
- 版本衝突處理

### Phase 5：管理介面
- 搜尋
- scope / type / status / priority 篩選
- 排序
- Fragment Detail
- Related / Project 關聯

## 11. v0.1 非目標

- GitHub Actions
- 主動式 AI 提醒
- 自動合併 Fragment
- 自動重新分類
- 向量資料庫
- 多 Repository Workspace
- 公開多使用者 SaaS
