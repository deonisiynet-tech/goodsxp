/**
 * Format plain text description into safe HTML.
 * Converts line breaks to <br> / <p> tags.
 * Strips dangerous HTML while preserving formatting.
 */

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
 * Convert plain text with line breaks to HTML.
 * - Double newline → <p> paragraph
 * - Single newline → <br>
 * - Bullet points (•, -, *, *) → <li>
 */
export function formatDescription(text: string): string {
  if (!text || typeof text !== 'string') return '';

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
