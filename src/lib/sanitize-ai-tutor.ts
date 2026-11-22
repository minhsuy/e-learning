/**
 * TMdemy — AI Tutor Response Sanitization Utility
 *
 * Cleans internal RAG citation markers (e.g. `[CHUNK:uuid]`, `[CHUNK:uuid1, CHUNK:uuid2]`)
 * from assistant responses before presentation, while strictly preserving:
 * - Markdown formatting (bold, italic, lists, headings)
 * - Code blocks (``` ... ```) and inline code (` ... `)
 * - Normal bracketed text (e.g. `[link text](url)`, `arr[0]`, `[NOTE]`)
 * - Sentence punctuation and spacing
 * - Structured citation DTOs (CitationDto objects remain untouched)
 */

const CHUNK_MARKER_REGEX = /\[\s*CHUNKS?\b[^\]]*\]/gi;

/**
 * Sanitizes an assistant answer string by removing raw chunk tags and repairing whitespace/punctuation.
 *
 * @param content Raw markdown string from backend assistant message
 * @returns Cleaned markdown string safe for presentation and clipboard copying
 */
export function sanitizeAiTutorAnswer(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }

  // Fast path: if no "chunk" is present, return immediately
  if (!/chunk/i.test(content)) {
    return content;
  }

  // 1. Protect code blocks (``` ... ```)
  const codeBlocks: string[] = [];
  let protectedContent = content.replace(/```[\s\S]*?```/g, (match) => {
    const token = `__CODE_BLOCK_${codeBlocks.length}__`;
    codeBlocks.push(match);
    return token;
  });

  // 2. Protect inline code (` ... `)
  const inlineCodes: string[] = [];
  protectedContent = protectedContent.replace(/`[^`\n]+`/g, (match) => {
    const token = `__INLINE_CODE_${inlineCodes.length}__`;
    inlineCodes.push(match);
    return token;
  });

  // 3. Remove all raw chunk markers
  let sanitized = protectedContent.replace(CHUNK_MARKER_REGEX, '');

  // 4. Clean up whitespace before sentence punctuation (e.g., "word ." -> "word.")
  sanitized = sanitized.replace(/[ \t]+([,.;:!?])/g, '$1');

  // 5. Clean up multiple horizontal spaces (e.g., "word  word" -> "word word")
  sanitized = sanitized.replace(/[ \t]{2,}/g, ' ');

  // 6. Clean up trailing spaces before line breaks or end of string
  sanitized = sanitized.replace(/[ \t]+(?=\r?\n|$)/g, '');

  // 7. Restore inline code
  sanitized = sanitized.replace(/__INLINE_CODE_(\d+)__/g, (_, idx) => {
    const index = parseInt(idx, 10);
    return inlineCodes[index] ?? '';
  });

  // 8. Restore code blocks
  sanitized = sanitized.replace(/__CODE_BLOCK_(\d+)__/g, (_, idx) => {
    const index = parseInt(idx, 10);
    return codeBlocks[index] ?? '';
  });

  return sanitized;
}

