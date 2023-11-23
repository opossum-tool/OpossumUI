// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { SET_VARIABLE } from './types';

export type VariablesAction = SetVariable;

export interface SetVariable {
  type: SET_VARIABLE;
  name: string;
  value: unknown;
}

export function setVariable(name: string, value: unknown): SetVariable {
  return {
    type: SET_VARIABLE,
    name,
    value,
  };
}
