// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

export function shouldNotBeCalled(variableOfInterest: never): never {
  throw Error(
    `There is a typing problem with respect to ${variableOfInterest}.`
  );
}
