import type { SuggestionType } from './types';

export interface SubmissionFormState {
  title: string;
  details: string;
  type: SuggestionType;
  error: string | null;
}

export function renderSubmissionFormHTML(state: SubmissionFormState): string {
  const types: SuggestionType[] = ['New Feature', 'Feature Update', 'Bug Report'];
  return `
    <form class="fs-form" novalidate>
      <h3 class="fs-form-title">Submit a Suggestion</h3>
      ${state.error ? `<p class="fs-form-error" role="alert">${escapeHtml(state.error)}</p>` : ''}
      <div class="fs-form-field">
        <label class="fs-form-label" for="fs-title">Title <span aria-hidden="true">*</span></label>
        <input
          class="fs-form-input${state.error ? ' fs-form-input--error' : ''}"
          id="fs-title"
          name="title"
          type="text"
          placeholder="Short, descriptive title"
          value="${escapeHtml(state.title)}"
          required
          aria-required="true"
          ${state.error ? 'aria-invalid="true"' : ''}
        />
      </div>
      <div class="fs-form-field">
        <label class="fs-form-label" for="fs-details">Details</label>
        <textarea
          class="fs-form-input fs-form-textarea"
          id="fs-details"
          name="details"
          placeholder="Optional — add more context"
          rows="4"
        >${escapeHtml(state.details)}</textarea>
      </div>
      <div class="fs-form-field">
        <label class="fs-form-label" for="fs-type">Type</label>
        <select class="fs-form-input fs-form-select" id="fs-type" name="type">
          ${types
            .map(
              t =>
                `<option value="${escapeHtml(t)}"${state.type === t ? ' selected' : ''}>${escapeHtml(t)}</option>`,
            )
            .join('')}
        </select>
      </div>
      <div class="fs-form-actions">
        <button type="submit" class="fs-btn fs-btn--primary">Submit</button>
        <button type="button" class="fs-btn fs-btn--cancel">Cancel</button>
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
