// Base repository interfaces
export * from "./base/IRepository";

// Entity-specific repository interfaces
export * from "./IAnalysisRepository";
export * from "./IUserRepository";
export * from "./IHackathonAnalysisRepository";
export * from "./IDashboardRepository";
export * from "./ICreditTransactionRepository";
export * from "./IIdeaRepository";
export * from "./IDocumentRepository";

// Repository types and interfaces
export type {
  AnalysisSearchCriteria,
  AnalysisSortOptions,
} from "./IAnalysisRepository";

export type { UserSearchCriteria, UserSortOptions } from "./IUserRepository";

export type {
  HackathonAnalysisData,
  HackathonAnalysisSearchCriteria,
  HackathonLeaderboardEntry,
} from "./IHackathonAnalysisRepository";

export type {
  DashboardAnalytics,
  UserActivitySummary,
  DashboardInsights,
  TimeFilter,
} from "./IDashboardRepository";
export type { CreditBalance } from "./ICreditTransactionRepository";

export type { IdeaSearchCriteria, IdeaSortOptions } from "./IIdeaRepository";

export type {
  DocumentSearchCriteria,
  DocumentSortOptions,
} from "./IDocumentRepository";
