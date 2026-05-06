// Feature Suggestion Widget — entry point

export type { StorageAdapter } from './adapter';
export { createFirebaseAdapter } from './adapters/firebase';
export { createHttpAdapter } from './adapters/http';
export type { HttpAdapterConfig } from './adapters/http';
export type {
  Suggestion,
  Comment,
  Vote,
  CreateSuggestionInput,
  CreateCommentInput,
  SuggestionType,
  SuggestionStatus,
} from './types';
export { defineWidget, FeatureSuggestionsElement } from './widget';
export type { WidgetUser, WidgetTheme, SortOption } from './widget';
