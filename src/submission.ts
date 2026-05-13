import type { SuggestionType } from './types';

export interface SubmissionFormState {
  title: string;
  details: string;
  type: SuggestionType;
  error: string | null;
  userName?: string;
}

export function renderSubmissionFormHTML(state: SubmissionFormState): string {
  const types: SuggestionType[] = [
    'New Feature',
    'Feature Update',
    'Bug Report',
  ];
  return `
    <form class="fs-form" novalidate>
      <h3 class="fs-form-title" id="fs-form-dialog-title">Submit a suggestion</h3>
      ${state.error ? `<p class="fs-form-error" role="alert">${escapeHtml(state.error)}</p>` : ''}
      <div class="fs-form-field">
        <span class="fs-form-label fs-form-label--section">TYPE</span>
        <div class="fs-type-toggle" role="group" aria-label="Suggestion type">
          ${types
            .map(
              t =>
                `<button type="button" class="fs-type-btn${state.type === t ? ' fs-type-btn--active' : ''}" data-type="${escapeHtml(t)}" aria-pressed="${state.type === t}">${escapeHtml(t)}</button>`,
            )
            .join('')}
        </div>
      </div>
      <div class="fs-form-field">
        <label class="fs-form-label fs-form-label--section" for="fs-title">TITLE <span class="fs-required" aria-hidden="true">*</span></label>
        <input
          class="fs-form-input${state.error ? ' fs-form-input--error' : ''}"
          id="fs-title"
          name="title"
          type="text"
          placeholder="Short, descriptive title"
          value="${escapeHtml(state.title)}"
          required
          aria-required="true"
          maxlength="80"
          ${state.error ? 'aria-invalid="true"' : ''}
        />
        <span class="fs-form-hint">Keep it under 80 characters so it scans well in the list.</span>
      </div>
      <div class="fs-form-field">
        <label class="fs-form-label fs-form-label--section" for="fs-details">DETAILS</label>
        <textarea
          class="fs-form-input fs-form-textarea"
          id="fs-details"
          name="details"
          placeholder="Optional - describe the problem, who it affects, and what success looks like."
          rows="4"
        >${escapeHtml(state.details)}</textarea>
      </div>
      <div class="fs-form-footer">
        <span class="fs-form-posting-as">Posting as <strong>${escapeHtml(state.userName ?? 'Anonymous')}</strong></span>
        <div class="fs-form-actions">
          <button type="button" class="fs-btn fs-btn--cancel">Cancel</button>
          <button type="submit" class="fs-btn fs-btn--primary">Submit suggestion</button>
        </div>
      </div>
    </form>
  `;
}

export function validateTitle(title: string): string | null {
  if (!title.trim()) {
    return 'Title is required.';
  }
  return null;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
