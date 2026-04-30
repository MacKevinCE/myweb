import { describe, it, expect } from 'vitest';
import { escapeHtml, getEl } from '../../src/scripts/os/utils';

describe('escapeHtml', () => {
  it('escapes HTML special characters', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });

  it('escapes ampersand', () => {
    expect(escapeHtml('foo & bar')).toBe('foo &amp; bar');
  });

  it('escapes single quotes', () => {
    expect(escapeHtml("it's")).toBe('it&#39;s');
  });

  it('returns empty string for empty input', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('does not double-escape', () => {
    expect(escapeHtml('&amp;')).toBe('&amp;amp;');
  });
});

describe('getEl', () => {
  it('returns element by id', () => {
    const div = document.createElement('div');
    div.id = 'test-el';
    document.body.appendChild(div);
    expect(getEl('test-el')).toBe(div);
    div.remove();
  });

  it('returns null for non-existent id', () => {
    expect(getEl('does-not-exist')).toBeNull();
  });
});
