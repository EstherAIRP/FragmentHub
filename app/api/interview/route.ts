import { NextResponse } from "next/server";
import { z } from "zod";

import {
  confirmedFragmentAnalysisSchema,
  interviewAnswerSchema,
  interviewDecisionJsonSchema,
  interviewDecisionSchema,
  type InterviewDecision,
} from "@/lib/analysis-schema";
import { callStructuredOutput } from "@/lib/ai/openai";
import {
  buildInterviewDeveloperPrompt,
  buildInterviewUserPrompt,
} from "@/lib/ai/prompts";

const MAX_INTERVIEW_QUESTIONS = 6;

const requestSchema = z.object({
  original_input: z.string().trim().min(1).max(20_000),
  analysis: confirmedFragmentAnalysisSchema,
  interview: z.array(interviewAnswerSchema).max(MAX_INTERVIEW_QUESTIONS),
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
        error: "提問資料格式不正確。",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  if (parsed.data.interview.length >= MAX_INTERVIEW_QUESTIONS) {
    const decision: InterviewDecision = {
      complete: true,
      question: null,
      focus: null,
      completion_reason: "已達 v0.1 提問上限 6 題。",
    };

    return NextResponse.json({
      decision,
      model: null,
    });
  }

  try {
    const response = await callStructuredOutput<InterviewDecision>({
      name: "fragment_interview_decision",
      schema: interviewDecisionJsonSchema,
      developer: buildInterviewDeveloperPrompt(),
      user: buildInterviewUserPrompt({
        originalInput: parsed.data.original_input,
        analysis: parsed.data.analysis,
        interview: parsed.data.interview,
      }),
      reasoningEffort: "low",
    });

    const decision = interviewDecisionSchema.parse(response.data);

    return NextResponse.json({
      decision,
      model: response.model,
    });
  } catch (error) {
    console.error("Fragment interview failed:", error);

    return NextResponse.json(
      { error: "GPT 提問判斷失敗，請稍後重試。" },
      { status: 502 },
    );
  }
}
