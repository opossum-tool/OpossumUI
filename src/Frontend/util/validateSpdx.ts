// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import * as ohm from 'ohm-js';
import spdxCorrect from 'spdx-correct';

export type SpdxExpressionValidationResult =
  | { type: 'valid' }
  | { type: 'syntax-error' }
  | { type: 'uncapitalized-conjunctions'; fix: string }
  | {
      type: 'unknown-licenses';
      unknownLicenseIds: Array<{
        unknownId: string;
        suggestion?: string;
        fix?: string;
      }>;
    };

// We can't just use \b because we see e.g. . and - as word characters.
const wordStart = String.raw`(?<=^|\(|\s)`;
const wordEnd = String.raw`(?=$|\)|\s)`;

export function validateSpdxEpression(
  spdxExpression: string,
  knownLicenseIds: Set<string>,
): SpdxExpressionValidationResult {
  if (spdxExpression === '') {
    return { type: 'valid' };
  }

  const parsedExpression = parseSpdxExpression(spdxExpression);

  if (parsedExpression.result === 'failed') {
    return { type: 'syntax-error' };
  }

  const withCapitalizedConjunctions = spdxExpression.replaceAll(
    new RegExp(`${wordStart}(and|or|with)${wordEnd}`, 'gi'),
    (match) => match.toUpperCase(),
  );

  if (spdxExpression !== withCapitalizedConjunctions) {
    return {
      type: 'uncapitalized-conjunctions',
      fix: withCapitalizedConjunctions,
    };
  }

  const unknownLicenseIds = getUnknownLicenseIdsWithSuggestions(
    spdxExpression,
    parsedExpression.licenseIds,
    knownLicenseIds,
  );

  if (unknownLicenseIds.length > 0) {
    return {
      type: 'unknown-licenses',
      unknownLicenseIds,
    };
  }

  return { type: 'valid' };
}

const grammar = ohm.grammar(`
  SPDX {
    LicenseExpression
      = CompoundExpression
      | LicenseId

    // The conjunctions contain spaces so we don't match MITANDAPACHE
    // We need the #'s here so we don't consume the spaces before trying to match them, which would fail
    CompoundExpression
      = LicenseId #with LicenseId
      | LicenseExpression #and LicenseExpression
      | LicenseExpression #or LicenseExpression
      | "(" LicenseExpression ")"

    // We want to allow spaces in license ids to offer corrections, but we don't want to just see "A AND B" as one token
    // So we have negative lookaheads to make sure that the characters we add to the id aren't the start of a conjunction
    LicenseId (a license id)
      = ~((andToken | orToken | withToken) #space) (~#and ~#or ~#with ~"(" ~")" any)+

    // These start with lower-case letters so they are "lexcal rules" that don't skip whitespace
    and = space+ andToken (space+ | end)
    or = space+ orToken (space+ | end)
    with = space+ withToken (space+ | end)

    andToken = caseInsensitive<"AND">
    orToken = caseInsensitive<"OR">
    withToken = caseInsensitive<"WITH">
  }
`);

function parseSpdxExpression(
  expression: string,
): { result: 'failed' } | { result: 'success'; licenseIds: Array<string> } {
  const match = grammar.match(expression);

  if (match.failed()) {
    return { result: 'failed' };
  }

  const semantics = grammar
    .createSemantics()
    .addOperation<Array<string>>('licenseIds', {
      _nonterminal(...children) {
        if (this.ctorName === 'LicenseId') {
          return [this.sourceString];
        }
        const childResults = children.map((child) => child.licenseIds());
        return childResults.flat();
      },
      _iter() {
        return [];
      },
      _terminal() {
        return [];
      },
    });

  const licenseIds = semantics(match).licenseIds() as Array<string>;

  return { result: 'success', licenseIds };
}

function getUnknownLicenseIdsWithSuggestions(
  fullExpression: string,
  licenseIds: Array<string>,
  knownLicenseIds: Set<string>,
) {
  const unknownLicenseIds: Array<{
    unknownId: string;
    suggestion?: string;
    fix?: string;
  }> = [];

  for (const id of new Set(
    licenseIds.filter((id) => !knownLicenseIds.has(id)),
  )) {
    let suggestion: string | undefined = undefined;

    if (id.match(/^LicenseRef/i) || id.match(/^DocumentRef/i)) {
      suggestion = id
        .replace(/^LicenseRef/i, 'LicenseRef')
        .replace(/^DocumentRef/i, 'DocumentRef')
        .replaceAll(' ', '-');

      if (suggestion === id) {
        continue;
      }
    } else {
      try {
        const spdxCorrection = spdxCorrect(id);
        if (spdxCorrection && knownLicenseIds.has(spdxCorrection)) {
          suggestion = spdxCorrect(id) ?? undefined;
        }
      } catch {
        // If spxdCorrect fails, we have no suggestion
      }
    }

    const idRegex = id.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

    const fix = suggestion
      ? fullExpression.replaceAll(
          new RegExp(`${wordStart}${idRegex}${wordEnd}`, 'g'),
          suggestion,
        )
      : undefined;

    unknownLicenseIds.push({ unknownId: id, suggestion, fix });
  }

  return unknownLicenseIds;
}
