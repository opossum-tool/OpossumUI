// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker } from '../../../testing/Faker';
import { SignalsWorker, SignalsWorkerOutput } from '../signals-worker';

describe('SignalsWorker', () => {
  it('dispatches autocomplete signals when dependencies are met', () => {
    const dispatch = jest.fn();
    const worker = new SignalsWorker(dispatch, {
      externalData: faker.opossum.externalAttributionData(),
      manualData: faker.opossum.manualAttributionData(),
      resolvedExternalAttributions: new Set<string>(),
      sources: faker.opossum.externalAttributionSources(),
    });

    worker.processInput({
      name: 'resourceId',
      data: faker.opossum.resourceName(),
    });

    expect(dispatch).toHaveBeenCalledWith<[SignalsWorkerOutput]>({
      name: 'autocompleteSignals',
      data: expect.any(Array),
    });
  });

  it('does not dispatch autocomplete signals when dependencies are missing', () => {
    const dispatch = jest.fn();
    new SignalsWorker(dispatch, {
      externalData: faker.opossum.externalAttributionData(),
      manualData: faker.opossum.manualAttributionData(),
      resolvedExternalAttributions: new Set<string>(),
      sources: faker.opossum.externalAttributionSources(),
    });

    expect(dispatch).not.toHaveBeenCalledWith<[SignalsWorkerOutput]>({
      name: 'autocompleteSignals',
      data: expect.any(Array),
    });
  });

  it('dispatches attributions in folder content when dependencies are met', () => {
    const dispatch = jest.fn();
    const worker = new SignalsWorker(dispatch, {
      manualData: faker.opossum.manualAttributionData(),
    });

    worker.processInput({
      name: 'resourceId',
      data: faker.opossum.resourceName(),
    });

    expect(dispatch).toHaveBeenCalledWith<[SignalsWorkerOutput]>({
      name: 'attributionsInFolderContent',
      data: expect.any(Object),
    });
  });

  it('does not dispatch attributions in folder content when dependencies are missing', () => {
    const dispatch = jest.fn();
    new SignalsWorker(dispatch, {
      manualData: faker.opossum.manualAttributionData(),
    });

    expect(dispatch).not.toHaveBeenCalledWith<[SignalsWorkerOutput]>({
      name: 'attributionsInFolderContent',
      data: expect.any(Object),
    });
  });

  it('dispatches signals in folder content when dependencies are met', () => {
    const dispatch = jest.fn();
    const worker = new SignalsWorker(dispatch, {
      externalData: faker.opossum.externalAttributionData(),
      resolvedExternalAttributions: new Set<string>(),
      attributionsToHashes: {},
    });

    worker.processInput({
      name: 'resourceId',
      data: faker.opossum.resourceName(),
    });

    expect(dispatch).toHaveBeenCalledWith<[SignalsWorkerOutput]>({
      name: 'signalsInFolderContent',
      data: expect.any(Object),
    });
  });

  it('does not dispatch signals in folder content when dependencies are missing', () => {
    const dispatch = jest.fn();
    new SignalsWorker(dispatch, {
      externalData: faker.opossum.externalAttributionData(),
      resolvedExternalAttributions: new Set<string>(),
      attributionsToHashes: {},
    });

    expect(dispatch).not.toHaveBeenCalledWith<[SignalsWorkerOutput]>({
      name: 'signalsInFolderContent',
      data: expect.any(Object),
    });
  });

  it('dispatches overall progress data when dependencies are met', () => {
    const dispatch = jest.fn();
    const worker = new SignalsWorker(dispatch, {
      attributionBreakpoints: new Set<string>(),
      externalData: faker.opossum.externalAttributionData(),
      filesWithChildren: new Set<string>(),
      manualData: faker.opossum.manualAttributionData(),
      resolvedExternalAttributions: new Set<string>(),
    });

    worker.processInput({
      name: 'resources',
      data: faker.opossum.resources(),
    });

    expect(dispatch).toHaveBeenCalledWith<[SignalsWorkerOutput]>({
      name: 'overallProgressData',
      data: expect.any(Object),
    });
  });

  it('does not dispatch overall progress data when dependencies are missing', () => {
    const dispatch = jest.fn();
    new SignalsWorker(dispatch, {
      attributionBreakpoints: new Set<string>(),
      externalData: faker.opossum.externalAttributionData(),
      filesWithChildren: new Set<string>(),
      manualData: faker.opossum.manualAttributionData(),
      resolvedExternalAttributions: new Set<string>(),
    });

    expect(dispatch).not.toHaveBeenCalledWith<[SignalsWorkerOutput]>({
      name: 'overallProgressData',
      data: expect.any(Object),
    });
  });

  it('dispatches folder progress data when dependencies are met', () => {
    const dispatch = jest.fn();
    const worker = new SignalsWorker(dispatch, {
      attributionBreakpoints: new Set<string>(),
      externalData: faker.opossum.externalAttributionData(),
      filesWithChildren: new Set<string>(),
      manualData: faker.opossum.manualAttributionData(),
      resolvedExternalAttributions: new Set<string>(),
      resources: faker.opossum.resources(),
    });

    worker.processInput({
      name: 'resourceId',
      data: faker.opossum.resourceName(),
    });

    expect(dispatch).toHaveBeenCalledWith<[SignalsWorkerOutput]>({
      name: 'folderProgressData',
      data: expect.any(Object),
    });
  });

  it('does not dispatch folder progress data when dependencies are missing', () => {
    const dispatch = jest.fn();
    new SignalsWorker(dispatch, {
      attributionBreakpoints: new Set<string>(),
      externalData: faker.opossum.externalAttributionData(),
      filesWithChildren: new Set<string>(),
      manualData: faker.opossum.manualAttributionData(),
      resolvedExternalAttributions: new Set<string>(),
      resources: faker.opossum.resources(),
    });

    expect(dispatch).not.toHaveBeenCalledWith<[SignalsWorkerOutput]>({
      name: 'folderProgressData',
      data: expect.any(Object),
    });
  });
});
