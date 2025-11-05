import type { Analysis, SavedAnalysisRecord } from '@/lib/types';
import type { SavedAnalysesRow } from './types';

export const mapSavedAnalysesRow = (row: SavedAnalysesRow): SavedAnalysisRecord => ({
  id: row.id,
  userId: row.user_id,
  idea: row.idea,
  analysis: row.analysis as unknown as Analysis,
  audioBase64: row.audio_base64,
  createdAt: row.created_at ?? new Date().toISOString(),
});
