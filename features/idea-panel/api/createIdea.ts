import type { IdeaDTO } from "@/src/infrastructure/web/dto/IdeaDTO";

export interface CreateIdeaInput {
  ideaText: string;
  source?: "manual" | "frankenstein";
}

export interface CreateIdeaResponse {
  idea: IdeaDTO;
}

/**
 * Create a new idea via the API
 * POST /api/v2/ideas
 */
export async function createIdea(input: CreateIdeaInput): Promise<IdeaDTO> {
  const response = await fetch("/api/v2/ideas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to create idea");
  }

  const result: CreateIdeaResponse = await response.json();
  return result.idea;
}
