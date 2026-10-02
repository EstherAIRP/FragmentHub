export const scopeLabels = {
  personal: "個人",
  work: "工作",
} as const;

export const typeLabels = {
  idea: "靈感",
  task: "待辦",
  learning: "學習",
  requirement: "需求",
  project: "專案",
  question: "問題",
  decision: "決策",
  tracking: "追蹤",
  resource: "資源",
  note: "紀錄",
} as const;

export const statusLabels = {
  inbox: "Inbox",
  seed: "Seed",
  exploring: "Exploring",
  defined: "Defined",
  actionable: "Actionable",
  active: "Active",
  waiting: "Waiting",
  done: "Done",
  archived: "Archived",
} as const;

export const levelLabels = {
  high: "High",
  medium: "Medium",
  low: "Low",
  none: "None",
} as const;

export function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Taipei",
  }).format(new Date(value));
}
