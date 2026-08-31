export type EvaluationAssessment = {
  playerId: string | null; summary: string | null; roleDescription: string | null; teamImpact: string | null; usageOutlook: string | null;
  strengths: string[]; risks: string[]; assessmentWindow: string | null; confidence: number | null; needsReview: boolean; sourceIds: string[];
};
export type EvaluationSource = { id: string | null; title: string | null; url: string | null };
export type EvaluationLoad = { status: 'idle' | 'loading' | 'available' | 'unavailable' | 'malformed' | 'error'; assessment: EvaluationAssessment | null; sources: EvaluationSource[]; model: string | null; receivedAt: string | null; error?: string };
export function normalizeEvaluationResponse(raw: unknown, entityId?: string): EvaluationLoad;
export function normalizeAssessment(raw: unknown): EvaluationAssessment | null;
export function confidenceLabel(value: number | null): string;
