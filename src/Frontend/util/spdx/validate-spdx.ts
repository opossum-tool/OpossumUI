// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { grammar } from 'ohm-js';

import { spdxCorrect } from './spdx-correct';

type SpdxUnknownLicenseId = {
  unknownId: string;
  suggestion?: string;
  fix?: string;
};

export type SpdxExpressionValidationResult =
  | { type: 'valid' }
  | { type: 'syntax-error' }
  | { type: 'uncapitalized-conjunctions'; fix: string }
  | {
      type: 'unknown-licenses';
      unknownLicenseIds: Array<SpdxUnknownLicenseId>;
    };

// We can't just use \b because we see e.g. . and - as word characters.
const wordStart = String.raw`(?<=^|\(|\s)`;
const wordEnd = String.raw`(?=$|\)|\s)`;

function escapeRegex(input: string): string {
  return input.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

export function validateSpdxExpression({
  spdxExpression,
  knownLicenseIds,
}: {
  spdxExpression: string;
  knownLicenseIds: Set<string>;
}): SpdxExpressionValidationResult {
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

  const unknownLicenseIds = getUnknownLicenseIdsWithSuggestions({
    licenseIds: parsedExpression.licenseIds,
    knownLicenseIds,
    fullExpression: spdxExpression,
  });

  if (unknownLicenseIds.length > 0) {
    return {
      type: 'unknown-licenses',
      unknownLicenseIds,
    };
  }

  return { type: 'valid' };
}

/**
 * Ohm.js grammar for parsing SPDX license expressions. See https://ohmjs.org/docs/intro for more information.
 */
const spdxGrammar = grammar(`
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

    // These start with lower-case letters so they are "lexical rules" that don't skip whitespace
    and = space+ andToken (space+ | end)
    or = space+ orToken (space+ | end)
    with = space+ withToken (space+ | end)

    andToken = caseInsensitive<"AND">
    orToken = caseInsensitive<"OR">
    withToken = caseInsensitive<"WITH">
  }
`);

/**
 * Parses an SPDX expression and returns the license ids if successful.
 */
function parseSpdxExpression(
  expression: string,
): { result: 'failed' } | { result: 'success'; licenseIds: Array<string> } {
  const match = spdxGrammar.match(expression);

  if (match.failed()) {
    return { result: 'failed' };
  }

  /**
   * After successfully parsing a string with the Ohm grammar you get an abstract syntax tree.
   * We want to iterate through the tree and get the license expressions.
   *
   * After visiting any node, we return a list of found license ids:
   * - If the current node is a licenseId, we return the license id
   * - Otherwise we return a list of all license ids found in its children
   * - In our grammar, licenseIds don't appear as children of iterations, so if we get to one we can stop searching
   * - Terminals are either AND, OR, WITH or they are children of a licenseId, so we will never see them
   */
  const semantics = spdxGrammar
    .createSemantics()
    .addOperation<Array<string>>('licenseIds', {
      LicenseId(_) {
        return [this.sourceString];
      },
      _nonterminal(...children) {
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

/**
 * From a list of license ids, filter out the ones we don't know and try to provide a suggestion.
 */
function getUnknownLicenseIdsWithSuggestions({
  licenseIds,
  knownLicenseIds,
  fullExpression,
}: {
  licenseIds: Array<string>;
  knownLicenseIds: Set<string>;
  fullExpression: string;
}): Array<SpdxUnknownLicenseId> {
  const unknownLicenseIds: Array<SpdxUnknownLicenseId> = [];

  for (const id of new Set(
    licenseIds.filter((id) => !knownLicenseIds.has(id)),
  )) {
    let suggestion: string | undefined = undefined;

    try {
      const spdxCorrection = spdxCorrect(id);
      if (spdxCorrection && knownLicenseIds.has(spdxCorrection)) {
        suggestion = spdxCorrection;
      }
    } catch {
      // If spxdCorrect fails, we have no suggestion
    }

    const fix = suggestion
      ? fullExpression.replaceAll(
          new RegExp(`${wordStart}${escapeRegex(id)}${wordEnd}`, 'g'),
          suggestion,
        )
      : undefined;

    unknownLicenseIds.push({ unknownId: id, suggestion, fix });
  }

  return unknownLicenseIds;
}
