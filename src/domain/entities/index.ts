// Shared base classes
export * from "./shared";

// Domain entities
export { Analysis } from "./Analysis";
export { User } from "./User";
export { CreditTransaction } from "./CreditTransaction";
export { Idea } from "./Idea";
export { Document } from "./Document";

// Entity interfaces
export type { CreateAnalysisProps, ReconstructAnalysisProps } from "./Analysis";
export type {
  CreateUserProps,
  ReconstructUserProps,
  UserPreferences,
} from "./User";
export type {
  CreateCreditTransactionProps,
  ReconstructCreditTransactionProps,
} from "./CreditTransaction";
export type { CreateIdeaProps, ReconstructIdeaProps } from "./Idea";
export type {
  CreateDocumentProps,
  ReconstructDocumentProps,
  DocumentContent,
} from "./Document";
