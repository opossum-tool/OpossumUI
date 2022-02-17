// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  getGlobalBackendState,
  setGlobalBackendState,
} from '../globalBackendState';
import { GlobalBackendState } from '../../types/types';

describe('The global backend state', () => {
  const newGlobalBackendState: GlobalBackendState = {
    resourceFilePath: '/some/path.json',
    attributionFilePath: '/some/other_path.json',
    projectId: 'uuid_1',
  };

  test('is empty upon initialization.', () => {
    expect(getGlobalBackendState()).toMatchObject({});
  });
  test('can be set and read', () => {
    setGlobalBackendState(newGlobalBackendState);
    expect(getGlobalBackendState()).toMatchObject(newGlobalBackendState);
  });
});
