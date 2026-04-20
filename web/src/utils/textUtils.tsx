import React from 'react';

/**
 * Decodes HTML entities in text
 * @param text - The text containing HTML entities
 * @returns Decoded text with proper characters
 */
export const decodeHtmlEntities = (text: string): string => {
  if (!text) return text;
  
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
};

/**
 * Formats text with line breaks for React rendering
 * @param text - The text to format
 * @returns JSX elements with proper line breaks
 */
export const formatTextWithLineBreaks = (text: string): JSX.Element => {
  return (
    <>
      {text.split('\n').map((line: string, index: number, array: string[]) => (
        <span key={index}>
          {line}
          {index < array.length - 1 && <br />}
        </span>
      ))}
    </>
  );
};

/**
 * Preserves line breaks in text by replacing \n with <br /> tags
 * Alternative approach using dangerouslySetInnerHTML
 * @param text - The text to format
 * @returns HTML string with <br /> tags
 */
export const formatTextWithBreaks = (text: string): string => {
  return text.replace(/\n/g, '<br />');
};
