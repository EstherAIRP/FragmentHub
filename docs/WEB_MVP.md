# FragmentHub Web MVP

> Phase：4 — Web MVP
> 狀態：完成
> 架構：純資料管理介面，不執行 AI。

## 1. Web 的責任

FragmentHub Web 負責：

- 私人登入門
- Dashboard
- Fragment List
- Search
- Filter
- Fragment Detail
- 手動新增草稿
- 手動編輯草稿
- Archive 狀態操作
- Project / Related / Backlink 顯示
- JSON 草稿預覽

Web 不負責：

- AI 分析
- AI 分類
- AI 提問
- AI Finalize
- OpenAI API 呼叫
- 自動寫入 GitHub

## 2. Routes

主要路由：

- /login
- /
- /fragments
- /fragments/new
- /fragments/[id]
- /fragments/[id]/edit

### /login

單一私人使用者登入頁。

需要環境變數：

- FRAGMENTHUB_PASSWORD
- FRAGMENTHUB_SESSION_SECRET

Session 使用 HttpOnly Cookie。

### /

Dashboard 顯示：

- Total
- Actionable
- Active
- Waiting
- Work
- Personal
- 最近更新 Fragment

### /fragments

支援：

- 關鍵字搜尋
- Scope
- Type
- Status
- Priority
- Urgency
- Domain
- Tag

搜尋範圍包含 ID、Title、Summary、Domain、Tag。

### /fragments/[id]

顯示：

- 完整內容
- Original input
- Notes
- Interview
- Metadata
- Project
- Related
- Backlinks
- Project children

### /fragments/new

純手動新增，不呼叫 AI。

使用者自行設定 Scope、Type、Status、Priority、Urgency、Domains、Tags、Project、Related、Title、Summary、Next action、Original input、Notes。

Phase 4 只驗證並預覽 JSON，不正式寫入 GitHub。

### /fragments/[id]/edit

手動編輯既有 Fragment 草稿。

保護規則：

- id 不可修改
- created_at 不可修改
- original_input 在 Web Edit 中為唯讀
- 既有 interview 保留
- 既有 source 保留
- Archive 只是把草稿 status 改成 archived

正式儲存留到 Phase 5。

## 3. Authentication

Phase 4 提供單一使用者密碼門。

所有 (private) Route Group 會先檢查 Session Cookie，未登入則導向 /login。

Repository 為 Private 不代表 Vercel 網站本身是 Private，因此登入門仍是必要的。

Phase 5 會再處理正式部署環境中的 Secret、登出與 Session 行為驗證。

## 4. Manual Draft

手動新增／編輯使用 lib/fragments/manual-draft.ts。

草稿會經 Zod 驗證，Domain 仍受 config/domains.json 限制。

新增草稿預覽不會產生真正的 Fragment ID、created_at、updated_at；這些仍由 Phase 2 Data Layer 在 Phase 5 正式 Save 時處理。

## 5. Search / Filter

查詢邏輯集中於 lib/fragments/query.ts，避免把搜尋規則散落在 React Component。

## 6. Relations

Detail 頁面直接顯示：

- Parent Project
- Related
- Backlinks
- Project children

Backlink 不需要寫回 Canonical JSON，仍由現有資料關係推導。

## 7. Phase 4 / Phase 5 邊界

Phase 4：

Read JSON → Browse / Search / Filter → Manual Edit → Validate Draft → Preview JSON

Phase 5：

Final Confirm → GitHub Store → Commit JSON → Refresh / Redeploy / Conflict Handling

所以 Phase 4 的「新增／編輯」代表 UI 與草稿流程完成，不代表資料已持久化。

## 8. Web MVP 驗收

Phase 4 完成條件：

1. 未登入無法查看私人頁面。
2. Dashboard 可讀取現有 Fragment。
3. List 可搜尋與篩選。
4. Detail 可查看完整資料與關聯。
5. New 可建立合法手動草稿。
6. Edit 可修改既有草稿且保留系統欄位。
7. Archive 可在 Edit 中設定。
8. JSON Preview 可呈現 Phase 5 待寫入內容。
9. Web Runtime 不存在 OpenAI API 呼叫。
10. Web 不需要 OPENAI_API_KEY。
