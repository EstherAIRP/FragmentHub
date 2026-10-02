import classification from "@/config/classification.json";
import domains from "@/config/domains.json";
import type { Fragment } from "@/lib/fragment-schema";
import type {
  ConfirmedFragmentAnalysis,
  InterviewAnswer,
} from "@/lib/analysis-schema";

export function buildClassificationDeveloperPrompt(
  fragmentContext: readonly Fragment[],
): string {
  const relationContext = fragmentContext.slice(0, 100).map((fragment) => ({
    id: fragment.id,
    title: fragment.title,
    scope: fragment.scope,
    type: fragment.type,
    status: fragment.status,
    domains: fragment.domains,
    tags: fragment.tags,
    project: fragment.project,
  }));

  return [
    "你是 FragmentHub 的 Fragment 預分析器。",
    "你的任務是提出建議，不是替使用者做最終決策。",
    "所有輸出都會先顯示給使用者確認，不能假設你的判斷已被接受。",
    "",
    "分類原則：",
    "- scope 只能選 work 或 personal。",
    "- type 只能有一個主要類型，以使用者目前的主要意圖判斷。",
    "- priority 是重要程度；urgency 是時間壓力，兩者不得混用。",
    "- domains 只能使用受控 Domain ID，不得自行創造。",
    "- tags 使用小寫 kebab-case，2–6 個為佳。",
    "- 若受控 Domain 不足以表達內容，domain_suggestion 填入簡短建議；domains 仍只能填既有 ID。",
    "- project / related 只有在提供的現有 Fragment context 有明確依據時才建議，否則使用 null / []。",
    "- 不得虛構不存在的 Fragment ID。",
    "- title 要簡潔可辨識；summary 忠實濃縮原始內容。",
    "- 若沒有明確下一步，next_action 使用 null。",
    "- classification_reason 只說明主要判斷依據，不輸出內部逐步推理。",
    "",
    "分類規則：",
    JSON.stringify(classification),
    "",
    "受控 Domains：",
    JSON.stringify(domains.domains),
    "",
    "可用的既有 Fragment context：",
    JSON.stringify(relationContext),
  ].join("\n");
}

export function buildInterviewDeveloperPrompt(): string {
  return [
    "你是 FragmentHub 的提問紀錄器。",
    "使用者已經確認分類，因此你不得重新分類或改變已確認 metadata。",
    "你的工作是判斷是否還有一個『值得問』的問題，可以讓這筆 Fragment 日後更容易理解、執行或延續討論。",
    "",
    "原則：",
    "- 一次最多提出一個問題。",
    "- 不重複已回答內容。",
    "- 不問只是為了填滿欄位的問題。",
    "- 如果資訊已足夠，complete=true 並停止提問。",
    "- 最多進行 6 個問答；若已達 6 個，必須 complete=true。",
    "- question 必須簡短、具體、自然。",
    "- focus 說明這題補的是哪個面向，例如 goal、constraint、done-definition、application、unknown、dependency。",
    "- completion_reason 只做簡短摘要，不輸出逐步推理。",
    "",
    "不同 type 可優先關注：",
    "- idea：核心價值、想解決的問題、未知點、可能發展方向。",
    "- task：完成條件、期限、依賴、下一個具體動作。",
    "- learning：學習目標、應用情境、目前程度、完成標準。",
    "- requirement：問題、使用者、輸入輸出、限制、完成條件。",
    "- project：目標、範圍、里程碑、限制、成功條件。",
    "- question：為什麼要回答、目前已知、需要驗證什麼。",
    "- decision：選項、考量、最終決定、後續影響。",
    "- tracking：等待什麼、由誰／什麼條件觸發下一步。",
    "- resource：用途、為何值得保存、預計在哪裡使用。",
    "- note：必要背景與之後可能需要回想的上下文。",
  ].join("\n");
}

export function buildFinalizeDeveloperPrompt(): string {
  return [
    "你是 FragmentHub 的最終紀錄整理器。",
    "分類 metadata 已經由使用者確認，不得重新分類。",
    "你只能根據原始輸入、已確認內容與 interview 整理最終文字欄位。",
    "",
    "規則：",
    "- title：簡潔、可單獨辨識，不能改變原本主題。",
    "- summary：忠實整合已知資訊，不新增未提供的事實。",
    "- next_action：只有存在明確可執行下一步時才填；否則 null。",
    "- notes：放不適合 summary / next_action、但對日後理解有價值的補充；沒有則 null。",
    "- 不把 interview 原文整段複製進 notes；interview 本身會另外保存。",
    "- 不輸出分類、ID、日期或任何未要求欄位。",
  ].join("\n");
}

export function buildInterviewUserPrompt(input: {
  originalInput: string;
  analysis: ConfirmedFragmentAnalysis;
  interview: readonly InterviewAnswer[];
}): string {
  return JSON.stringify({
    original_input: input.originalInput,
    confirmed_analysis: input.analysis,
    interview_so_far: input.interview,
  });
}

export function buildFinalizeUserPrompt(input: {
  originalInput: string;
  analysis: ConfirmedFragmentAnalysis;
  interview: readonly InterviewAnswer[];
}): string {
  return JSON.stringify({
    original_input: input.originalInput,
    confirmed_analysis: input.analysis,
    interview: input.interview,
  });
}
