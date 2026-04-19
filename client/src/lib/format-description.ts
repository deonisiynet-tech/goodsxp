/**
 * Format description into safe HTML.
 * Supports both:
 * 1. Rich HTML from WYSIWYG editor (sanitized)
 * 2. Plain text with line breaks (legacy format)
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Escape HTML entities to prevent XSS.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Check if text contains HTML tags
 */
function isHtml(text: string): boolean {
  return /<[a-z][\s\S]*>/i.test(text);
}

/**
 * Convert plain text with line breaks to HTML.
 * - Double newline → <p> paragraph
 * - Single newline → <br>
 * - Bullet points (•, -, *, *) → <li>
 */
function plainTextToHtml(text: string): string {
  // First escape all HTML entities
  let escaped = escapeHtml(text);

  // Split into paragraphs (double newlines)
  const paragraphs = escaped.split(/\n\s*\n/).filter(Boolean);

  if (paragraphs.length <= 1) {
    // Single block — just convert single newlines to <br>
    // Handle bullet points
    const lines = escaped.split(/\n/);
    const hasBullets = lines.some(
      (l) => l.trim().startsWith('•') || l.trim().startsWith('- ') || l.trim().startsWith('* ')
    );

    if (hasBullets) {
      let html = '<ul>';
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const content = trimmed.replace(/^[•\-*]\s*/, '');
          html += `<li>${content}</li>`;
        } else if (trimmed) {
          html += `<li>${trimmed}</li>`;
        }
      }
      html += '</ul>';
      return html;
    }

    return escaped.replace(/\n/g, '<br>');
  }

  // Multiple paragraphs
  let html = '';
  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    const lines = trimmed.split(/\n/);
    const hasBullets = lines.some(
      (l) => l.trim().startsWith('•') || l.trim().startsWith('- ') || l.trim().startsWith('* ')
    );

    if (hasBullets) {
      html += '<ul>';
      for (const line of lines) {
        const t = line.trim();
        if (t.startsWith('•') || t.startsWith('- ') || t.startsWith('* ')) {
          const content = t.replace(/^[•\-*]\s*/, '');
          html += `<li>${content}</li>`;
        } else if (t) {
          html += `<li>${t}</li>`;
        }
      }
      html += '</ul>';
    } else {
      const content = trimmed.replace(/\n/g, '<br>');
      html += `<p>${content}</p>`;
    }
  }

  return html;
}

/**
 * Main function: format description text into safe HTML
 */
export function formatDescription(text: string): string {
  if (!text || typeof text !== 'string') return '';

  // Check if text already contains HTML tags (from WYSIWYG editor)
  if (isHtml(text)) {
    // Sanitize HTML to prevent XSS
    const clean = DOMPurify.sanitize(text, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'b', 'em', 'i', 'u',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li',
        'blockquote', 'pre', 'code',
        'a', 'span', 'div',
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
      ALLOW_DATA_ATTR: false,
    });
    return clean;
  }

  // Plain text — convert to HTML
  return plainTextToHtml(text);
}
