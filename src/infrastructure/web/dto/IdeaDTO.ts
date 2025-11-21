import { z } from "zod";

import type { DocumentContent } from "@/src/domain/entities";

/**
 * DTO for Idea response
 */
export interface IdeaDTO {
  id: string;
  userId: string;
  ideaText: string;
  source: "manual" | "frankenstein";
  projectStatus: "idea" | "in_progress" | "completed" | "archived";
  notes: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO for Document response
 */
export interface DocumentDTO {
  id: string;
  ideaId: string;
  userId: string;
  documentType: "startup_analysis" | "hackathon_analysis";
  title: string | null;
  content: DocumentContent;
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO for Idea with Documents response
 */
export interface IdeaWithDocumentsDTO {
  idea: IdeaDTO;
  documents: DocumentDTO[];
}

/**
 * DTO for creating a new idea
 */
export interface CreateIdeaDTO {
  ideaText: string;
  source: "manual" | "frankenstein";
  projectStatus?: "idea" | "in_progress" | "completed" | "archived";
  notes?: string;
  tags?: string[];
}

/**
 * Zod validation schema for CreateIdeaDTO
 */
export const CreateIdeaSchema = z.object({
  ideaText: z
    .string()
    .min(10, "Idea text must be at least 10 characters")
    .max(5000, "Idea text cannot exceed 5000 characters")
    .trim(),
  source: z.enum(["manual", "frankenstein"], {
    message: 'Source must be either "manual" or "frankenstein"',
  }),
  projectStatus: z
    .enum(["idea", "in_progress", "completed", "archived"], {
      message:
        'Project status must be one of: "idea", "in_progress", "completed", "archived"',
    })
    .optional(),
  notes: z
    .string()
    .max(10000, "Notes cannot exceed 10000 characters")
    .optional(),
  tags: z
    .array(
      z
        .string()
        .min(1, "Tag cannot be empty")
        .max(50, "Tag cannot exceed 50 characters")
    )
    .max(50, "Cannot have more than 50 tags")
    .optional(),
});

/**
 * DTO for updating idea status
 */
export interface UpdateIdeaStatusDTO {
  projectStatus: "idea" | "in_progress" | "completed" | "archived";
}

/**
 * Zod validation schema for UpdateIdeaStatusDTO
 */
export const UpdateIdeaStatusSchema = z.object({
  projectStatus: z.enum(["idea", "in_progress", "completed", "archived"], {
    message:
      'Project status must be one of: "idea", "in_progress", "completed", "archived"',
  }),
});

/**
 * DTO for saving idea metadata
 */
export interface SaveIdeaMetadataDTO {
  notes?: string;
  tags?: string[];
}

/**
 * Zod validation schema for SaveIdeaMetadataDTO
 */
export const SaveIdeaMetadataSchema = z.object({
  notes: z
    .string()
    .max(10000, "Notes cannot exceed 10000 characters")
    .optional(),
  tags: z
    .array(
      z
        .string()
        .min(1, "Tag cannot be empty")
        .max(50, "Tag cannot exceed 50 characters")
    )
    .max(50, "Cannot have more than 50 tags")
    .optional(),
});

/**
 * DTO for creating a new document
 */
export interface CreateDocumentDTO {
  ideaId: string;
  documentType: "startup_analysis" | "hackathon_analysis";
  title?: string;
  content: DocumentContent;
}

/**
 * Zod validation schema for CreateDocumentDTO
 */
export const CreateDocumentSchema = z.object({
  ideaId: z.string().min(1, "Idea ID cannot be empty"),
  documentType: z.enum(["startup_analysis", "hackathon_analysis"], {
    message:
      'Document type must be either "startup_analysis" or "hackathon_analysis"',
  }),
  title: z.string().max(500, "Title cannot exceed 500 characters").optional(),
  content: z.any(),
});

/**
 * Optimized DTO for dashboard idea card display
 * Contains only the fields needed for dashboard cards to reduce data transfer
 */
export interface DashboardIdeaDTO {
  id: string;
  ideaText: string;
  source: string;
  projectStatus: string;
  documentCount: number;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}
