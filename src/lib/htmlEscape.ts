 /**
  * Escapes HTML special characters to prevent XSS attacks
  * @param text - The text to escape
  * @returns The escaped text safe for HTML insertion
  */
 export const escapeHtml = (text: string | null | undefined): string => {
   return String(text || '')
     .replace(/&/g, '&amp;')
     .replace(/</g, '&lt;')
     .replace(/>/g, '&gt;')
     .replace(/"/g, '&quot;')
     .replace(/'/g, '&#039;');
 };