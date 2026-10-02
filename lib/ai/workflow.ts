import {
  confirmedFragmentAnalysisSchema,
  fragmentAnalysisSchema,
  interviewAnswerSchema,
  type ConfirmedFragmentAnalysis,
  type FragmentAnalysis,
  type InterviewAnswer,
} from "@/lib/analysis-schema";

export function confirmAnalysis(
  analysis: FragmentAnalysis,
): ConfirmedFragmentAnalysis {
  return confirmedFragmentAnalysisSchema.parse({
    ...fragmentAnalysisSchema.parse(analysis),
    confirmed: true,
  });
}

export function reopenConfirmedAnalysis(
  analysis: ConfirmedFragmentAnalysis,
): FragmentAnalysis {
  const { confirmed: _confirmed, ...editable } =
    confirmedFragmentAnalysisSchema.parse(analysis);

  return fragmentAnalysisSchema.parse(editable);
}

export function appendInterviewAnswer(
  interview: readonly InterviewAnswer[],
  answer: InterviewAnswer,
): InterviewAnswer[] {
  if (interview.length >= 6) {
    throw new Error("FragmentHub v0.1 interview is limited to 6 questions.");
  }

  return [
    ...interview.map((item) => interviewAnswerSchema.parse(item)),
    interviewAnswerSchema.parse(answer),
  ];
}
