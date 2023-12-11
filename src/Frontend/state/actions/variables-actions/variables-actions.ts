// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { SET_VARIABLE } from './types';

export type VariablesAction = SetVariable;

export interface SetVariable<T = unknown> {
  type: SET_VARIABLE;
  name: string;
  value: T;
}

export function setVariable<T>(name: string, value: T): SetVariable<T> {
  return {
    type: SET_VARIABLE,
    name,
    value,
  };
}
