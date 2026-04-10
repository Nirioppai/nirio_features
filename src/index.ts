// Feature Suggestion Widget — entry point

export type { StorageAdapter } from './adapter';
export { createFirebaseAdapter } from './adapters/firebase';
export type {
  Suggestion,
  Comment,
  Vote,
  CreateSuggestionInput,
  CreateCommentInput,
  SuggestionType,
  SuggestionStatus,
} from './types';
export { defineWidget } from './widget';
export type { WidgetUser, WidgetTheme, SortOption } from './widget';
