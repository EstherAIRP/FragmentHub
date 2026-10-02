# FragmentHub

FragmentHub 是一個以 GPT 輔助整理生活、工作、學習與靈感碎片的私人管理系統。

## 核心原則

- 單一 Private Repository
- 單一 Fragment 資料池
- JSON 作為 Source of Truth
- 不以資料夾切割工作／私人內容
- 透過 metadata（如 `scope`、`type`、`domains`、`tags`）分類
- GPT 負責預判與結構化；使用者負責最終確認
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
- Phase 3：GPT 分析層 ⏳
- Phase 4：Web MVP
- Phase 5：GitHub / Vercel 整合

Phase 1 正式規格：`docs/DATA_SPEC.md`

Phase 2 資料層說明：`docs/DATA_LAYER.md`

目前下一步為 Phase 3：GPT 分析層。


## 資料層指令

```bash
npm run validate:data
npm run build:index
npm run test:data
npm run typecheck
```

`npm run build` 會透過 `prebuild` 先驗證所有 Fragment 並重新產生 `generated/index.json`。

資料層實作與 GitHub Remote Store 說明見 `docs/DATA_LAYER.md`。
