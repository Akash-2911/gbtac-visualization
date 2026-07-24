import React from 'react';

// Matches trend words and explicitly-signed numbers so AI summary/chat text
// can be scanned at a glance — no backend/prompt changes, works on whatever
// plain-English sentence the model already returns.
const HIGHLIGHT_PATTERN =
  /(?<positive>\b(?:increase[ds]?|increasing|rising|rose|higher|more|gain(?:ed|s)?|positive|surplus|improved?|growth|grew|exceed(?:ed|s)?|above)\b)|(?<negative>\b(?:decrease[ds]?|decreasing|falling|fell|lower|less|drop(?:ped|s)?|deficit|negative|declin(?:e|ed|ing)|reduc(?:ed|tion|ing)?|below|shortfall)\b)|(?<signedNumber>[+-]\s?\d[\d,]*\.?\d*%?)/gi;

export function highlightMetrics(text, colors = {}) {
  if (!text) return text;

  const { positive = 'var(--status-green-text)', negative = 'var(--status-red-text)' } = colors;
  const nodes = [];
  let lastIndex = 0;
  let key = 0;

  for (const match of text.matchAll(HIGHLIGHT_PATTERN)) {
    const { index } = match;
    if (index > lastIndex) {
      nodes.push(text.slice(lastIndex, index));
    }

    const matchedText = match[0];
    const isNegative = Boolean(match.groups.negative) || (Boolean(match.groups.signedNumber) && matchedText.trim().startsWith('-'));
    const color = isNegative ? negative : positive;

    nodes.push(
      <span key={key++} style={{ color, fontWeight: 600 }}>
        {matchedText}
      </span>
    );

    lastIndex = index + matchedText.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}
