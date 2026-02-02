// SPDX-FileCopyrightText: spdx-correct.js contributors
// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import spdxLicenseIds from 'spdx-license-ids/index.json';

function valid(string: string): boolean {
  return spdxLicenseIds.includes(string);
}

type Transposition = readonly [string, string];

// Sorting function that orders the given array of transpositions such
// that a transposition with the longer pattern comes before a transposition
// with a shorter pattern. This is to prevent e.g. the transposition
// ["General Public License", "GPL"] from matching to "Lesser General Public License"
// before a longer and more accurate transposition ["Lesser General Public License", "LGPL"]
// has a chance to be recognized.
function sortTranspositions(a: Transposition, b: Transposition): number {
  const length = b[0].length - a[0].length;
  if (length !== 0) {
    return length;
  }
  return a[0].toUpperCase().localeCompare(b[0].toUpperCase());
}

// Common transpositions of license identifier acronyms.
const transpositions: Array<Transposition> = (
  [
    [' INTERNATIONAL', ''],
    [' OR LATER', '+'],
    ['+', ''],
    ['-LICENSE', ''],
    ['0 CLAUSE BSD', '0BSD'],
    ['0-CLAUSE BSD', '0BSD'],
    ['APGL', 'AGPL'],
    ['APL', 'Apache'],
    ['BLUE OAK', 'BlueOak'],
    ['BLUE-OAK', 'BlueOak'],
    ['BUSINESS SOURCE LICENSE', 'BUSL'],
    ['CLAUDE', 'Clause'],
    ['ELASTIC LICENSE', 'Elastic'],
    ['ELV2', 'Elastic-2.0'],
    ['GLP', 'GPL'],
    ['GNU', 'GPL'],
    ['GNU GENERAL PUBLIC LICENSE', 'GPL'],
    ['GNU GLP', 'GPL'],
    ['GNU GPL', 'GPL'],
    ['GNU LESSER GENERAL PUBLIC LICENSE', 'LGPL'],
    ['GNU LGPL', 'LGPL'],
    ['GNU PUBLIC LICENSE', 'GPL'],
    ['GNU/GPL', 'GPL'],
    ['GUN', 'GPL'],
    ['HIPPOCRATIC LICENSE', 'Hippocratic'],
    ['ISD', 'ISC'],
    ['IST', 'ISC'],
    ['LESSER GENERAL PUBLIC LICENSE', 'LGPL'],
    ['MOZILLA PUBLIC LICENSE', 'MPL'],
    ['MTI', 'MIT'],
    ['POLYFORM NON-COMMERCIAL', 'PolyForm-Noncommercial'],
    ['POLYFORM NONCOMMERCIAL', 'PolyForm-Noncommercial'],
    ['POLYFORM SMALL BUSINESS', 'PolyForm-Small-Business'],
    ['PYTHON SOFTWARE FOUNDATION', 'PSF'],
    ['UNIVERSAL PERMISSIVE LICENSE', 'UPL'],
    ['WTFGPL', 'WTFPL'],
    ['WTH', 'WTF'],
    ['ZERO BSD', '0BSD'],
    ['ZERO-BSD', '0BSD'],
  ] as const
).toSorted(sortTranspositions);

const TRANSPOSED = 0;
const CORRECT = 1;

// Simple corrections to nearly valid identifiers.
const transforms: Array<(argument: string) => string> = [
  // e.g. 'mit'
  (argument) => argument.toUpperCase(),
  // e.g. 'MIT '
  (argument) => argument.trim(),
  // e.g. 'M.I.T.'
  (argument) => argument.replace(/\./g, ''),
  // e.g. 'Apache- 2.0'
  (argument) => argument.replace(/\s+/g, ''),
  // e.g. 'CC BY 4.0''
  (argument) => argument.replace(/\s+/g, '-'),
  // e.g. 'LGPLv2.1'
  (argument) => argument.replace('v', '-'),
  // e.g. 'Apache 2.0'
  (argument) => argument.replace(/,?\s*(\d)/, '-$1'),
  // e.g. 'GPL 2'
  (argument) => argument.replace(/,?\s*(\d)/, '-$1.0'),
  // e.g. 'Apache Version 2.0'
  (argument) =>
    argument.replace(/,?\s*(V\.|v\.|V|v|Version|version)\s*(\d)/, '-$2'),
  // e.g. 'Apache Version 2'
  (argument) =>
    argument.replace(/,?\s*(V\.|v\.|V|v|Version|version)\s*(\d)/, '-$2.0'),
  // e.g. 'ZLIB'
  (argument) => argument[0].toUpperCase() + argument.slice(1),
  // e.g. 'MPL/2.0'
  (argument) => argument.replace('/', '-'),
  // e.g. 'Apache 2'
  (argument) => argument.replace(/\s*V\s*(\d)/, '-$1').replace(/(\d)$/, '$1.0'),
  // e.g. 'GPL-2.0', 'GPL-3.0'
  (argument) => {
    if (argument.includes('3.0')) {
      return `${argument}-or-later`;
    }
    return `${argument}-only`;
  },
  // e.g. 'GPL-2.0-'
  (argument) => `${argument}only`,
  // e.g. 'GPL2'
  (argument) => argument.replace(/(\d)$/, '-$1.0'),
  // e.g. 'BSD 3'
  (argument) => argument.replace(/(-| )?(\d)$/, '-$2-Clause'),
  // e.g. 'BSD clause 3'
  (argument) => argument.replace(/(-| )clause(-| )(\d)/, '-$3-Clause'),
  // e.g. 'New BSD license'
  (argument) =>
    argument.replace(
      /\b(Modified|New|Revised)(-| )?BSD((-| )License)?/i,
      'BSD-3-Clause',
    ),
  // e.g. 'Simplified BSD license'
  (argument) =>
    argument.replace(/\bSimplified(-| )?BSD((-| )License)?/i, 'BSD-2-Clause'),
  // e.g. 'Free BSD license'
  (argument) =>
    argument.replace(
      /\b(Free|Net)(-| )?BSD((-| )License)?/i,
      'BSD-2-Clause-$1BSD',
    ),
  // e.g. 'Clear BSD license'
  (argument) =>
    argument.replace(/\bClear(-| )?BSD((-| )License)?/i, 'BSD-3-Clause-Clear'),
  // e.g. 'Old BSD License'
  (argument) =>
    argument.replace(
      /\b(Old|Original)(-| )?BSD((-| )License)?/i,
      'BSD-4-Clause',
    ),
  // e.g. 'BY-NC-4.0'
  (argument) => `CC-${argument}`,
  // e.g. 'BY-NC'
  (argument) => `CC-${argument}-4.0`,
  // e.g. 'Attribution-NonCommercial'
  (argument) =>
    argument
      .replace('Attribution', 'BY')
      .replace('NonCommercial', 'NC')
      .replace('NoDerivatives', 'ND')
      .replace(/ (\d)/, '-$1')
      .replace(/ ?International/, ''),
  // e.g. 'Attribution-NonCommercial'
  (argument) =>
    `CC-${argument
      .replace('Attribution', 'BY')
      .replace('NonCommercial', 'NC')
      .replace('NoDerivatives', 'ND')
      .replace(/ (\d)/, '-$1')
      .replace(/ ?International/, '')}-4.0`,
];

const licensesWithOneVersion = Object.entries(
  spdxLicenseIds
    .map((id) => {
      const match = /^(.*)-\d+\.\d+$/.exec(id);
      return match ? ([match[0], match[1]] as const) : ([id, null] as const);
    })
    .reduce<Record<string, Array<string>>>((objectMap, item) => {
      const key = item[1];
      if (key !== null) {
        objectMap[key] = objectMap[key] || [];
        objectMap[key].push(item[0]);
      }
      return objectMap;
    }, {}),
)
  .filter(
    (entry): entry is [string, Array<string>] =>
      // License has just one valid version suffix.
      entry[1].length === 1 &&
      // APL will be considered Apache, rather than APL-1.0
      entry[0] !== 'APL',
  )
  .map(([key, versions]): readonly [string, string] => [key, versions[0]]);

// If all else fails, guess that strings containing certain substrings
// meant to identify certain licenses.
const lastResorts: Array<readonly [string, string]> = (
  [
    ['0BSD', '0BSD'],
    ['2 CLAUSE', 'BSD-2-Clause'],
    ['2-CLAUSE', 'BSD-2-Clause'],
    ['3 CLAUSE', 'BSD-3-Clause'],
    ['3-CLAUSE', 'BSD-3-Clause'],
    ['AFFERO', 'AGPL-3.0-or-later'],
    ['AGPL', 'AGPL-3.0-or-later'],
    ['APACHE', 'Apache-2.0'],
    ['ARTISTIC', 'Artistic-2.0'],
    ['BEER', 'Beerware'],
    ['BLUE OAK', 'BlueOak-1.0.0'],
    ['BLUEOAK', 'BlueOak-1.0.0'],
    ['BOOST', 'BSL-1.0'],
    ['BSD', 'BSD-2-Clause'],
    ['BUSINESS SOURCE', 'BUSL-1.1'],
    ['BUSL', 'BUSL-1.1'],
    ['CDDL', 'CDDL-1.1'],
    ['CECILL', 'CECILL-2.1'],
    ['ECLIPSE', 'EPL-2.0'],
    ['ELASTIC', 'Elastic-2.0'],
    ['EPL', 'EPL-2.0'],
    ['EUPL', 'EUPL-1.2'],
    ['FUCK', 'WTFPL'],
    ['GNU', 'GPL-3.0-or-later'],
    ['GPL', 'GPL-3.0-or-later'],
    ['GPL-1', 'GPL-1.0-only'],
    ['GPL-2', 'GPL-2.0-only'],
    ['GPLV1', 'GPL-1.0-only'],
    ['GPLV2', 'GPL-2.0-only'],
    ['HIPPOCRATIC', 'Hippocratic-2.1'],
    ['LGPL', 'LGPL-3.0-or-later'],
    ['MIT', 'MIT'],
    ['MIT +NO-FALSE-ATTRIBS', 'MITNFA'],
    ['MPL', 'MPL-2.0'],
    ['MULAN', 'MulanPSL-2.0'],
    ['OFL', 'OFL-1.1'],
    ['OPEN FONT', 'OFL-1.1'],
    ['POLYFORM', 'PolyForm-Noncommercial-1.0.0'],
    ['PSF', 'PSF-2.0'],
    ['PYTHON', 'PSF-2.0'],
    ['SIL', 'OFL-1.1'],
    ['UNLI', 'Unlicense'],
    ['WTF', 'WTFPL'],
    ['X11', 'X11'],
    ['ZLIB', 'Zlib'],
  ] as Array<readonly [string, string]>
)
  .concat(licensesWithOneVersion)
  .toSorted(sortTranspositions);

const SUBSTRING = 0;
const IDENTIFIER = 1;

function validTransformation(identifier: string): string | null {
  for (const transform of transforms) {
    const transformed = transform(identifier).trim();
    if (transformed !== identifier && valid(transformed)) {
      return transformed;
    }
  }
  return null;
}

function validLastResort(identifier: string): string | null {
  const upperCased = identifier.toUpperCase();
  for (const lastResort of lastResorts) {
    if (upperCased.includes(lastResort[SUBSTRING])) {
      return lastResort[IDENTIFIER];
    }
  }
  return null;
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function anyCorrection(
  identifier: string,
  check: (corrected: string) => string | null,
): string | null {
  for (const transposition of transpositions) {
    const transposed = transposition[TRANSPOSED];
    const pattern = new RegExp(escapeRegExp(transposed), 'i');
    if (pattern.test(identifier)) {
      const corrected = identifier.replace(pattern, transposition[CORRECT]);
      const checked = check(corrected);
      if (checked !== null) {
        return checked;
      }
    }
  }
  return null;
}

interface SpdxCorrectOptions {
  upgrade?: boolean;
}

export function spdxCorrect(
  identifier: string,
  options: SpdxCorrectOptions = {},
): string | null {
  const upgrade = options.upgrade ?? true;

  function postprocess(value: string): string {
    return upgrade ? upgradeGPLs(value) : value;
  }

  const validArgument =
    typeof identifier === 'string' && identifier.trim().length !== 0;
  if (!validArgument) {
    throw Error('Invalid argument. Expected non-empty string.');
  }

  identifier = identifier.trim();
  if (valid(identifier)) {
    return postprocess(identifier);
  }

  const noPlus = identifier.replace(/\+$/, '').trim();
  if (valid(noPlus)) {
    return postprocess(noPlus);
  }

  let transformed: string | null = validTransformation(identifier);
  if (transformed !== null) {
    return postprocess(transformed);
  }

  transformed = anyCorrection(identifier, (argument) => {
    if (valid(argument)) {
      return argument;
    }
    return validTransformation(argument);
  });
  if (transformed !== null) {
    return postprocess(transformed);
  }

  transformed = validLastResort(identifier);
  if (transformed !== null) {
    return postprocess(transformed);
  }

  transformed = anyCorrection(identifier, validLastResort);
  if (transformed !== null) {
    return postprocess(transformed);
  }

  return null;
}

function upgradeGPLs(value: string): string {
  if (
    [
      'AGPL-1.0',
      'AGPL-2.0',
      'GPL-1.0',
      'GPL-2.0',
      'LGPL-1.0',
      'LGPL-2.0',
      'LGPL-2.1',
    ].includes(value)
  ) {
    return `${value}-only`;
  } else if (
    [
      'AGPL-1.0+',
      'AGPL-3.0+',
      'GPL-1.0+',
      'GPL-2.0+',
      'GPL-3.0+',
      'LGPL-2.0+',
      'LGPL-2.1+',
      'LGPL-3.0+',
    ].includes(value)
  ) {
    return value.replace(/\+$/, '-or-later');
  } else if (['AGPL-3.0', 'GPL-3.0', 'LGPL-3.0'].includes(value)) {
    return `${value}-or-later`;
  }
  return value;
}
