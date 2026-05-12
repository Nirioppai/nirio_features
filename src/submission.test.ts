import { describe, it, expect } from 'vitest';
import { renderSubmissionFormHTML, validateTitle } from './submission';
import type { SubmissionFormState } from './submission';

const base: SubmissionFormState = {
  title: '',
  details: '',
  type: 'New Feature',
  error: null,
};

describe('renderSubmissionFormHTML', () => {
  it('renders title input, details textarea, and type buttons', () => {
    const html = renderSubmissionFormHTML(base);
    expect(html).toContain('id="fs-title"');
    expect(html).toContain('id="fs-details"');
    expect(html).toContain('data-type="New Feature"');
  });

  it('renders submit and cancel buttons', () => {
    const html = renderSubmissionFormHTML(base);
    expect(html).toContain('type="submit"');
    expect(html).toContain('fs-btn--cancel');
  });

  it('renders all three suggestion types as options', () => {
    const html = renderSubmissionFormHTML(base);
    expect(html).toContain('New Feature');
    expect(html).toContain('Feature Update');
    expect(html).toContain('Bug Report');
  });

  it('marks the current type as active', () => {
    const html = renderSubmissionFormHTML({ ...base, type: 'Bug Report' });
    expect(html).toContain('data-type="Bug Report"');
    expect(html).toContain('fs-type-btn--active');
  });

  it('renders error message with role="alert" when error is set', () => {
    const html = renderSubmissionFormHTML({
      ...base,
      error: 'Title is required.',
    });
    expect(html).toContain('Title is required.');
    expect(html).toContain('role="alert"');
    expect(html).toContain('fs-form-error');
  });

  it('does not render error element when error is null', () => {
    const html = renderSubmissionFormHTML(base);
    expect(html).not.toContain('fs-form-error');
  });

  it('adds aria-invalid to title input when error is set', () => {
    const html = renderSubmissionFormHTML({
      ...base,
      error: 'Title is required.',
    });
    expect(html).toContain('aria-invalid="true"');
  });

  it('does not add aria-invalid when there is no error', () => {
    const html = renderSubmissionFormHTML(base);
    expect(html).not.toContain('aria-invalid');
  });

  it('populates title input value', () => {
    const html = renderSubmissionFormHTML({ ...base, title: 'My suggestion' });
    expect(html).toContain('value="My suggestion"');
  });

  it('escapes HTML in title value', () => {
    const html = renderSubmissionFormHTML({
      ...base,
      title: '<script>alert(1)</script>',
    });
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>');
  });

  it('escapes HTML in error message', () => {
    const html = renderSubmissionFormHTML({ ...base, error: '<b>bad</b>' });
    expect(html).toContain('&lt;b&gt;bad&lt;/b&gt;');
    expect(html).not.toContain('<b>bad</b>');
  });
});

describe('validateTitle', () => {
  it('returns null for a non-empty title', () => {
    expect(validateTitle('My feature idea')).toBeNull();
  });

  it('returns an error string for an empty string', () => {
    expect(validateTitle('')).toBe('Title is required.');
  });

  it('returns an error string for a whitespace-only string', () => {
    expect(validateTitle('   ')).toBe('Title is required.');
  });

  it('returns null for a title with surrounding whitespace', () => {
    expect(validateTitle('  valid title  ')).toBeNull();
  });
});
