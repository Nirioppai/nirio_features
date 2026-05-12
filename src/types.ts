export type SuggestionType = 'New Feature' | 'Feature Update' | 'Bug Report';

export type SuggestionStatus =
  | 'Under Review'
  | 'Planned'
  | 'In Progress'
  | 'Completed'
  | 'Declined';

export interface Suggestion {
  id: string;
  title: string;
  details?: string;
  type: SuggestionType;
  status?: SuggestionStatus;
  authorId: string;
  authorName: string;
  createdAt: Date;
  voteCount: number;
  commentCount: number;
  /** True when the current user has already voted for this suggestion. */
  userVoted?: boolean;
}

export interface Comment {
  id: string;
  suggestionId: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: Date;
  is_admin_response?: boolean;
}

export interface Vote {
  suggestionId: string;
  userId: string;
}

export type CreateSuggestionInput = {
  title: string;
  details?: string;
  type: SuggestionType;
  authorId: string;
  authorName: string;
};

export type CreateCommentInput = {
  authorId: string;
  authorName: string;
  body: string;
};

export interface WidgetLayout {
  bare?: boolean;
  formMode?: 'inline' | 'modal';
  filterStyle?: 'dropdown' | 'pill-row';
  maxFeedWidth?: number;
  mobileBreakpoint?: number;
  mobileDialogStyle?: 'center' | 'fullscreen';
  title?: string;
  subtitle?: string;
}
