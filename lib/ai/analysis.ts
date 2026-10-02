import type { Fragment } from "@/lib/fragment-schema";
import {
  fragmentAnalysisSchema,
  type FragmentAnalysis,
} from "@/lib/analysis-schema";

export type AnalysisSanitizationResult = {
  analysis: FragmentAnalysis;
  warnings: string[];
};

export function sanitizeAnalysisRelations(
  candidate: unknown,
  fragments: readonly Fragment[],
): AnalysisSanitizationResult {
  const parsed = fragmentAnalysisSchema.parse(candidate);
  const byId = new Map(fragments.map((fragment) => [fragment.id, fragment]));
  const warnings: string[] = [];

  let project = parsed.project;

  if (project) {
    const target = byId.get(project);

    if (!target || target.type !== "project") {
      warnings.push(
        `Ignored invalid project suggestion ${project}; target does not exist or is not a project.`,
      );
      project = null;
    }
  }

  const related = parsed.related.filter((id) => {
    if (!byId.has(id)) {
      warnings.push(`Ignored missing related Fragment suggestion ${id}.`);
      return false;
    }

    return true;
  });

  return {
    analysis: {
      ...parsed,
      project,
      related: Array.from(new Set(related)),
    },
    warnings,
  };
}
