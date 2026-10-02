# FragmentHub

FragmentHub 是一個以 GPT 輔助整理生活、工作、學習與靈感碎片的私人管理系統。

## 核心原則

- 單一 Private Repository
- 單一 Fragment 資料池
- JSON 作為 Source of Truth
- 不以資料夾切割工作／私人內容
- 透過 metadata（如 `scope`、`type`、`domains`、`tags`）分類
- ChatGPT 負責預判與結構化；使用者負責最終確認
- 未經確認不寫入正式 Fragment
- GitHub Actions 不屬於 v0.1 必要元件

## 預定流程

```text
使用者提出內容
    ↓
GPT 依規則預分析
    ↓
回報分類、標籤、優先度等結果
    ↓
與使用者討論修改
    ↓
使用者確認
    ↓
詢問是否進入提問紀錄模式
    ↓
提問 / 跳過
    ↓
最終預覽與確認
    ↓
寫入 GitHub JSON
```

## 資料模型

所有正式資料統一存放於：

```text
data/fragments/
  F-000001.json
  F-000002.json
  ...
```

工作與私人內容不以路徑區隔，而以欄位表示：

```json
{
  "scope": "work"
}
```

或：

```json
{
  "scope": "personal"
}
```


## 系統架構

FragmentHub 採「ChatGPT 負責 AI、GitHub 負責資料、Web 負責管理」的分工。

```text
                    ChatGPT
                       │
        分析 / 分類 / 討論 / 提問 / 確認
                       │
                       ▼
                    GitHub
             Fragment JSON Source of Truth
                       ▲
                       │
                  GitHub API
                       │
                       ▼
               FragmentHub Web
        瀏覽 / 搜尋 / 篩選 / 編輯 / 管理
```

### ChatGPT

負責：

- 接收使用者提出的碎片
- 分析 `scope / type / status / priority / urgency`
- 建議 `domains / tags / project / related`
- 與使用者討論並修改分類結果
- 詢問是否進入提問紀錄模式
- 整理最終 Fragment JSON
- 經使用者最終確認後寫入 GitHub

ChatGPT 是 FragmentHub 唯一的 AI 分析入口。

### GitHub

負責：

- 保存 `data/fragments/*.json`
- 作為 Fragment 的唯一 Source of Truth
- 保存 Git 版本歷史
- 提供 Web 與 ChatGPT 共用的資料來源

### FragmentHub Web

負責：

- Dashboard
- Fragment List
- Search
- Filter
- Fragment Detail
- 手動新增
- 手動編輯
- Archive
- Project / Related 關聯管理

Web **不呼叫 OpenAI API、不執行 GPT 分析，也不需要 `OPENAI_API_KEY`**。

網站只是 GitHub Fragment 資料的管理介面，不是另一個 AI Agent。

### 核心邊界

```text
AI 判斷
→ ChatGPT

正式資料
→ GitHub JSON

資料管理 UI
→ FragmentHub Web
```

不得在 Web 端另外建立一套 AI 分類流程。


## 技術方向

- Next.js
- TypeScript
- React
- Zod
- GitHub API
- Vercel
- GPT

## 開發狀態

- Phase 1：資料規格 ✅
- Phase 2：Repository 與資料層 ✅
- Phase 3：ChatGPT 操作契約 ✅
- Phase 4：Web MVP ✅
- Phase 5：GitHub Runtime Integration ✅／Vercel Production Activation ⏳

Phase 1 正式規格：`docs/DATA_SPEC.md`

Phase 2 資料層說明：`docs/DATA_LAYER.md`

Phase 3 ChatGPT 操作契約：`docs/CHATGPT_WORKFLOW.md`

Phase 4 Web MVP 說明：`docs/WEB_MVP.md`

Phase 5 Runtime 整合已完成；Vercel production activation 尚需建立 FragmentHub 專案並設定私人 Secret。\n\nPhase 5 部署說明：`docs/DEPLOYMENT.md`


## 資料層指令

```bash
npm run validate:data
npm run build:index
npm run test:data
npm run test:web
npm run test
npm run typecheck
```

`npm run build` 會透過 `prebuild` 先驗證所有 Fragment 並重新產生 `generated/index.json`。

資料層實作與 GitHub Remote Store 說明見 `docs/DATA_LAYER.md`。


## Production secrets

```text
FRAGMENTHUB_PASSWORD
FRAGMENTHUB_SESSION_SECRET
FRAGMENTHUB_GITHUB_TOKEN
```

完整部署與權限說明見 `docs/DEPLOYMENT.md`。
