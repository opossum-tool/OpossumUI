// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act } from '@testing-library/react';

import { faker } from '../../../testing/Faker';
import { setProjectMetadata } from '../../state/actions/resource-actions/all-views-simple-actions';
import { renderHook } from '../../test-helpers/render';
import { useSignalsWorker } from '../use-signals-worker';

const mockPostMessage = jest.fn();
const mockTerminate = jest.fn();

class Worker {
  url: string;
  postMessage = mockPostMessage;
  terminate = mockTerminate;

  constructor(scriptURL: string) {
    this.url = scriptURL;
  }
}

describe('useSignalsWorker', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'Worker', {
      writable: true,
      value: Worker,
    });
  });

  it('does not re-initialize worker when project ID is stable', () => {
    const metadata = faker.opossum.metadata();
    renderHook(useSignalsWorker, {
      actions: [setProjectMetadata(metadata)],
    });

    expect(mockTerminate).not.toHaveBeenCalled();
  });

  it('re-initializes worker when project ID changes', () => {
    const metadata = faker.opossum.metadata();
    const { store } = renderHook(useSignalsWorker, {
      actions: [setProjectMetadata(metadata)],
    });

    act(() => {
      store.dispatch(
        setProjectMetadata({ ...metadata, projectId: faker.string.sample() }),
      );
    });

    expect(mockTerminate).toHaveBeenCalledTimes(1);
  });
});
