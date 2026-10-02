# FragmentHub GPT Prompt Policy

Phase 3 的可執行 Prompt 由 `lib/ai/prompts.ts` 組裝，並直接引用：

- `config/classification.json`
- `config/domains.json`

這樣分類規則與 Domain 清單不需要在多份 Prompt 文件中手動同步。

## 三個 GPT 階段

### 1. Classification

輸入：使用者原始內容 + 既有 Fragment context。  
輸出：尚未確認的分類提案。

不得：

- 寫入 GitHub
- 假設分類已確認
- 創造未核准 Domain
- 虛構 relation ID

### 2. Interview

只有分類已確認後才可進入。

輸入：

- 原始內容
- confirmed analysis
- 既有 interview Q/A

輸出：

- 下一個問題，或
- complete=true

一次只問一題，最多六題。

### 3. Finalize

輸入：

- 原始內容
- confirmed analysis
- interview

模型只整理：

- title
- summary
- next_action
- notes

分類 Metadata 完全由程式保留，不交給模型重新決定。

## 人類確認邊界

```text
AI Classification Proposal
        ↓
Human Edit / Confirm
        ↓
Optional Interview
        ↓
AI Final Text Draft
        ↓
Final Preview
        ↓
Human Confirm Save
        ↓
Data Layer / GitHub
```

Phase 3 到 Final Preview 為止，不負責真正寫入 GitHub。
