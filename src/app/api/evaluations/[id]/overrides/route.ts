import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAppContext } from "@/lib/auth/context";
import { canManage } from "@/lib/auth/roles";
import { calculateEffectiveWeightedScore, evaluationResultSchema } from "@/lib/domain/evaluation";
import { scenarioSpecSchema } from "@/lib/domain/scenario";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const bodySchema = z.object({ criterionId: z.string().min(1).max(100), replacementScore: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)]), rationale: z.string().trim().min(10).max(1_000) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await requireAppContext();
  if (!canManage(context.role)) return NextResponse.json({ code: "unauthorized", message: "Manager access is required." }, { status: 403 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ code: "validation_failed", message: "Choose a criterion, score, and explain the override." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  if (!supabase || context.demo) return NextResponse.json({ persisted: false, effectiveScore: null });
  const { id } = await params;
  const { data: evaluation } = await supabase.from("evaluations").select("id,result,scenario_version_id").eq("id", id).eq("organization_id", context.organization.id).maybeSingle();
  if (!evaluation) return NextResponse.json({ code: "not_found", message: "Evaluation not found." }, { status: 404 });
  const { data: version } = await supabase.from("scenario_versions").select("scenario_spec").eq("id", evaluation.scenario_version_id).eq("organization_id", context.organization.id).maybeSingle();
  if (!version) return NextResponse.json({ code: "not_found", message: "Scenario version not found." }, { status: 404 });
  const result = evaluationResultSchema.parse(evaluation.result);
  const scenario = scenarioSpecSchema.parse(version.scenario_spec);
  if (!scenario.evaluatorOnly.rubric.some((criterion) => criterion.id === parsed.data.criterionId)) return NextResponse.json({ code: "validation_failed", message: "Criterion is not part of this evaluation rubric." }, { status: 400 });
  const { data: priorRows } = await supabase.from("manager_score_overrides").select("id,criterion_id,replacement_score,created_at").eq("evaluation_id", id).eq("organization_id", context.organization.id).order("created_at", { ascending: false });
  const latestByCriterion = new Map<string, { id: string; replacementScore: 0 | 1 | 2 | 3 | 4 }>();
  for (const row of priorRows ?? []) if (row.criterion_id && !latestByCriterion.has(row.criterion_id)) latestByCriterion.set(row.criterion_id, { id: row.id, replacementScore: row.replacement_score as 0 | 1 | 2 | 3 | 4 });
  const prior = latestByCriterion.get(parsed.data.criterionId);
  latestByCriterion.set(parsed.data.criterionId, { id: prior?.id ?? "pending", replacementScore: parsed.data.replacementScore });
  const effectiveScore = calculateEffectiveWeightedScore(result, scenario.evaluatorOnly.rubric, [...latestByCriterion].map(([criterionId, value]) => ({ criterionId, replacementScore: value.replacementScore })));
  const { data, error } = await supabase.from("manager_score_overrides").insert({ organization_id: context.organization.id, evaluation_id: id, criterion_id: parsed.data.criterionId, replacement_score: parsed.data.replacementScore, rationale: parsed.data.rationale, manager_id: context.user.id, supersedes_override_id: prior?.id ?? null, effective_weighted_score: effectiveScore }).select("id,created_at").single();
  if (error) return NextResponse.json({ code: "internal_error", message: "The score override could not be saved." }, { status: 500 });
  return NextResponse.json({ ...data, effectiveScore, persisted: true });
}
