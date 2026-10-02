import { NextResponse } from "next/server";
import { z } from "zod";

import {
  confirmedFragmentAnalysisSchema,
  finalizedContentJsonSchema,
  finalizedContentSchema,
  interviewAnswerSchema,
  type FinalizedContent,
} from "@/lib/analysis-schema";
import { buildFinalRecordDraft } from "@/lib/ai/final-record";
import { callStructuredOutput } from "@/lib/ai/openai";
import {
  buildFinalizeDeveloperPrompt,
  buildFinalizeUserPrompt,
} from "@/lib/ai/prompts";

const requestSchema = z.object({
  original_input: z.string().trim().min(1).max(20_000),
  analysis: confirmedFragmentAnalysisSchema,
  interview: z.array(interviewAnswerSchema).max(6),
  source: z.enum(["chatgpt", "web"]).default("web"),
});

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

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "最終紀錄資料格式不正確。",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const response = await callStructuredOutput<FinalizedContent>({
      name: "fragment_final_content",
      schema: finalizedContentJsonSchema,
      developer: buildFinalizeDeveloperPrompt(),
      user: buildFinalizeUserPrompt({
        originalInput: parsed.data.original_input,
        analysis: parsed.data.analysis,
        interview: parsed.data.interview,
      }),
      reasoningEffort: "low",
    });

    const content = finalizedContentSchema.parse(response.data);
    const draft = buildFinalRecordDraft({
      originalInput: parsed.data.original_input,
      analysis: parsed.data.analysis,
      interview: parsed.data.interview,
      content,
      source: parsed.data.source,
    });

    return NextResponse.json({
      draft,
      model: response.model,
      requires_final_confirmation: true,
    });
  } catch (error) {
    console.error("Fragment finalization failed:", error);

    return NextResponse.json(
      { error: "GPT 最終整理失敗，請稍後重試。" },
      { status: 502 },
    );
  }
}
