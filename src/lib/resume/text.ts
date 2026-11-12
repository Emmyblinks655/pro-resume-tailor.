const STOP = new Set(
  `a an the and or of for to in on with at by from as is are was were be been being this that those these your you our their into over under than then not no yes via per using use used will would can may`.split(
    " ",
  ),
);

export function tokens(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9+#.]+/g) ?? []).filter(
    (token) => token.length > 2 && !STOP.has(token),
  );
}

function hits(token: string, jdTokens: Set<string>): boolean {
  if (jdTokens.has(token)) return true;
  if (token.length < 5) return false;
  for (const jobToken of jdTokens) {
    if (jobToken.length < 5) continue;
    if (jobToken.startsWith(token) || token.startsWith(jobToken)) return true;
  }
  return false;
}

export function scoreText(text: string, jdTokens: Set<string>): number {
  let score = 0;
  for (const token of tokens(text)) {
    if (hits(token, jdTokens)) score += 1;
  }
  return score;
}

export function numbersIn(text: string): string[] {
  return text.match(/\d+(?:[.,]\d+)?%?/g) ?? [];
}

export function hasInventedNumber(text: string, source: string): boolean {
  const known = new Set(numbersIn(source));
  return numbersIn(text).some((value) => !known.has(value));
}

export function yearsIn(text: string): string[] {
  return text.match(/\b(?:19|20)\d{2}\b/g) ?? [];
}
