import { NextResponse } from "next/server";
import { z } from "zod";

import classification from "@/config/classification.json";
import {
  fragmentAnalysisJsonSchema,
  fragmentAnalysisSchema,
} from "@/lib/analysis-schema";

const requestSchema = z.object({
  input: z.string().trim().min(1).max(20_000),
});

function extractOutputText(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const response = payload as {
    output?: Array<{
      type?: string;
      content?: Array<{
        type?: string;
        text?: string;
      }>;
    }>;
  };

  for (const item of response.output ?? []) {
    if (item.type !== "message") continue;

    for (const content of item.content ?? []) {
      if (content.type === "output_text" && typeof content.text === "string") {
        return content.text;
      }
    }
  }

  return null;
}

export async function POST(request: Request) {
  if (
    process.env.VERCEL_ENV === "production" &&
    process.env.FRAGMENTHUB_ALLOW_PRODUCTION_ANALYSIS !== "true"
  ) {
    return NextResponse.json(
      {
        error:
          "Production AI analysis is disabled until FragmentHub authentication is implemented.",
      },
      { status: 403 },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured." },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsedRequest = requestSchema.safeParse(body);

  if (!parsedRequest.success) {
    return NextResponse.json(
      { error: "請輸入要整理的內容。" },
      { status: 400 },
    );
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-5.6-terra";

  const developerInstruction = [
    "你是 FragmentHub 的預分析器。",
    "你的工作是提出分類建議，不是替使用者做最終決策。",
    "請依照提供的分類規則判斷 scope、type、status、priority、urgency、domains 與 tags。",
    "priority 只代表重要程度；urgency 只代表時間急迫程度，兩者不得混為一談。",
    "domains 應是較穩定的領域名稱；tags 應是較細粒度且可搜尋的標籤。",
    "title 要簡潔且可辨識；summary 要忠實濃縮原始內容。",
    "若沒有明確 next action，可回傳 null。",
    "classification_reason 只需簡短說明主要判斷依據，不要輸出冗長推理過程。",
    "輸出只能包含指定的結構化欄位。",
    "",
    "分類規則：",
    JSON.stringify(classification),
  ].join("\n");

  const openAIResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      reasoning: {
        effort: "low",
      },
      input: [
        {
          role: "developer",
          content: developerInstruction,
        },
        {
          role: "user",
          content: parsedRequest.data.input,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "fragment_pre_analysis",
          strict: true,
          schema: fragmentAnalysisJsonSchema,
        },
      },
    }),
  });

  if (!openAIResponse.ok) {
    const details = await openAIResponse.text();
    console.error("OpenAI analysis failed:", details);

    return NextResponse.json(
      { error: "AI 預分析失敗，請稍後重試。" },
      { status: 502 },
    );
  }

  const payload = await openAIResponse.json();
  const outputText = extractOutputText(payload);

  if (!outputText) {
    return NextResponse.json(
      { error: "AI 沒有回傳可解析的分析結果。" },
      { status: 502 },
    );
  }

  let structured: unknown;

  try {
    structured = JSON.parse(outputText);
  } catch {
    return NextResponse.json(
      { error: "AI 回傳內容不是有效 JSON。" },
      { status: 502 },
    );
  }

  const validated = fragmentAnalysisSchema.safeParse(structured);

  if (!validated.success) {
    console.error("Invalid analysis payload:", validated.error.flatten());

    return NextResponse.json(
      { error: "AI 回傳內容未通過 FragmentHub Schema 驗證。" },
      { status: 502 },
    );
  }

  return NextResponse.json({
    analysis: validated.data,
    model,
  });
}
