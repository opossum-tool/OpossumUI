// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

/** Match the database's canonical license names, folding ASCII letters only. */
export function normalizeLicenseSearch(value: string): string {
  return value
    .replace(/[- ]/g, '')
    .replace(/[A-Z]/g, (letter) => letter.toLowerCase());
}
