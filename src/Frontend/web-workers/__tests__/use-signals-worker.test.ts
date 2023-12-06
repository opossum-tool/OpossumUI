// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act } from '@testing-library/react';

import { faker } from '../../../shared/Faker';
import { View } from '../../enums/enums';
import { setProjectMetadata } from '../../state/actions/resource-actions/all-views-simple-actions';
import { setSelectedResourceId } from '../../state/actions/resource-actions/audit-view-simple-actions';
import { setView } from '../../state/actions/view-actions/view-actions';
import { renderHook } from '../../test-helpers/render-component-with-store';
import { SignalsWorkerInput } from '../signals-worker';
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

  it('sets resource ID when in audit view and a resource ID is present', () => {
    const metadata = faker.opossum.metadata();
    const resourceId = faker.opossum.resourceName();
    renderHook(useSignalsWorker, {
      actions: [
        setProjectMetadata(metadata),
        setView(View.Audit),
        setSelectedResourceId(resourceId),
      ],
    });

    expect(mockPostMessage).toHaveBeenCalledWith<[SignalsWorkerInput]>({
      name: 'resourceId',
      data: resourceId,
    });
  });

  it('does not set resource ID when not in audit view', () => {
    const metadata = faker.opossum.metadata();
    const resourceId = faker.opossum.resourceName();
    renderHook(useSignalsWorker, {
      actions: [
        setProjectMetadata(metadata),
        setView(View.Attribution),
        setSelectedResourceId(resourceId),
      ],
    });

    expect(mockPostMessage).not.toHaveBeenCalledWith<[SignalsWorkerInput]>({
      name: 'resourceId',
      data: resourceId,
    });
  });

  it('does not set resource ID when no resource ID is present', () => {
    const metadata = faker.opossum.metadata();
    const resourceId = faker.opossum.resourceName();
    renderHook(useSignalsWorker, {
      actions: [setProjectMetadata(metadata), setView(View.Audit)],
    });

    expect(mockPostMessage).not.toHaveBeenCalledWith<[SignalsWorkerInput]>({
      name: 'resourceId',
      data: resourceId,
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
