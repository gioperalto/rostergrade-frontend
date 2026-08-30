export type Player = {
  id: string;
  position?: string | null;
  position_label?: string | null;
  slot?: string | null;
  role?: string | null;
  position_rank?: number | null;
  projected_points?: number | null;
  projected_points_per_game?: number | null;
  defensive_event_evidence?: unknown;
};

export type ProjectionMode = 'season' | 'game';
export type DefensiveEventStatus = 'available' | 'partial' | 'unavailable' | 'invalid' | 'invalid_data' | string;
export type DefensiveEventDefinition = { key: string; label: string };
export type DefensiveEvent = {
  status: DefensiveEventStatus;
  season: number | null;
  perGame: number | null;
  scoringContribution: number | null;
  source: string | null;
};
export type DefensiveEventEvidence = {
  source: string | null;
  status: DefensiveEventStatus;
  events: Record<string, DefensiveEvent>;
};

export function findPlayerById<T extends Player>(players: T[], id: string): T | null;
export function decodePlayerRouteId(value: string): string | null;
export function getPlayerSlotLabel(player: Pick<Player, 'position' | 'position_rank' | 'slot' | 'position_label'>): string;
export function projectionDisplay(player: Player, mode?: ProjectionMode): number | null;
export function isDST(player: Player): boolean;
export function defensiveEventEvidence(player: Player): DefensiveEventEvidence;
export function defensiveEventDefinitions(): DefensiveEventDefinition[];
