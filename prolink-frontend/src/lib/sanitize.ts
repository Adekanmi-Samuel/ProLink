import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks.
 * Used for rendering user-generated content like chat messages.
 */
export function sanitizeHTML(dirty: string): string {
  if (typeof window === 'undefined') {
    // Server-side: return escaped string
    return dirty
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
}

/**
 * Sanitize plain text for safe display (no HTML allowed).
 */
export function sanitizeText(text: string): string {
  if (typeof window === 'undefined') {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
}
