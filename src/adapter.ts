import type {
  Suggestion,
  Comment,
  Vote,
  CreateSuggestionInput,
  CreateCommentInput,
  SuggestionStatus,
} from './types';

export interface StorageAdapter {
  // Suggestions
  getSuggestions(): Promise<Suggestion[]>;
  createSuggestion(input: CreateSuggestionInput): Promise<Suggestion>;
  setStatus(suggestionId: string, status: SuggestionStatus): Promise<void>;

  // Votes
  getVote(suggestionId: string, userId: string): Promise<Vote | null>;
  addVote(suggestionId: string, userId: string): Promise<void>;
  removeVote(suggestionId: string, userId: string): Promise<void>;

  // Comments
  getComments(suggestionId: string): Promise<Comment[]>;
  addComment(suggestionId: string, input: CreateCommentInput): Promise<Comment>;
}
