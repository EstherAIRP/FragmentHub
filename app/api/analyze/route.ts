import { NextResponse } from "next/server";
import { z } from "zod";

import {
  fragmentAnalysisJsonSchema,
  fragmentAnalysisSchema,
  type FragmentAnalysis,
} from "@/lib/analysis-schema";
import { sanitizeAnalysisRelations } from "@/lib/ai/analysis";
import { callStructuredOutput } from "@/lib/ai/openai";
import { buildClassificationDeveloperPrompt } from "@/lib/ai/prompts";
import { listFragments } from "@/lib/fragments";

const requestSchema = z.object({
  input: z.string().trim().min(1).max(20_000),
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
  const parsedRequest = requestSchema.safeParse(body);

  if (!parsedRequest.success) {
    return NextResponse.json(
      { error: "請輸入要整理的內容。" },
      { status: 400 },
    );
  }

  try {
    const fragments = await listFragments();

    const response = await callStructuredOutput<FragmentAnalysis>({
      name: "fragment_pre_analysis",
      schema: fragmentAnalysisJsonSchema,
      developer: buildClassificationDeveloperPrompt(fragments),
      user: parsedRequest.data.input,
      reasoningEffort: "low",
    });

    const validated = fragmentAnalysisSchema.parse(response.data);
    const sanitized = sanitizeAnalysisRelations(validated, fragments);

    return NextResponse.json({
      analysis: sanitized.analysis,
      warnings: sanitized.warnings,
      model: response.model,
      requires_confirmation: true,
    });
  } catch (error) {
    console.error("Fragment pre-analysis failed:", error);

    return NextResponse.json(
      { error: "GPT 預分析失敗，請稍後重試。" },
      { status: 502 },
    );
  }
}
