// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { text } from '../../../shared/text';
import { faker } from '../../../testing/Faker';
import { SignalsWorker, SignalsWorkerOutput } from '../signals-worker';

describe('SignalsWorker', () => {
  it('dispatches filtered attributions when dependencies are met', () => {
    const dispatch = jest.fn();
    const worker = new SignalsWorker(dispatch, {
      attributionBreakpoints: faker.opossum.attributionBreakpoints(),
      attributionFilters: [],
      attributionSearch: '',
      attributionSelectedLicense: '',
      attributionSorting: text.sortings.name,
      manualData: faker.opossum.attributionData(),
    });

    worker.processInput({
      name: 'resourceId',
      data: faker.opossum.resourceName(),
    });

    expect(dispatch).toHaveBeenCalledWith<[SignalsWorkerOutput]>({
      name: 'filteredAttributions',
      data: expect.any(Object),
    });
  });

  it('does not dispatch filtered attributions when dependencies are missing', () => {
    const dispatch = jest.fn();
    const worker = new SignalsWorker(dispatch, {
      attributionBreakpoints: faker.opossum.attributionBreakpoints(),
      attributionFilters: [],
      attributionSearch: '',
      attributionSelectedLicense: '',
      attributionSorting: text.sortings.name,
    });

    worker.processInput({
      name: 'resourceId',
      data: faker.opossum.resourceName(),
    });

    expect(dispatch).not.toHaveBeenCalledWith<[SignalsWorkerOutput]>({
      name: 'filteredAttributions',
      data: expect.any(Object),
    });
  });

  it('dispatches filtered signals when dependencies are met', () => {
    const dispatch = jest.fn();
    const worker = new SignalsWorker(dispatch, {
      areHiddenSignalsVisible: false,
      externalData: faker.opossum.attributionData(),
      resolvedExternalAttributions: faker.opossum.resolvedAttributions(),
      signalFilters: [],
      signalSearch: '',
      signalSelectedLicense: '',
      signalSorting: text.sortings.name,
    });

    worker.processInput({
      name: 'resourceId',
      data: faker.opossum.resourceName(),
    });

    expect(dispatch).toHaveBeenCalledWith<[SignalsWorkerOutput]>({
      name: 'filteredSignals',
      data: expect.any(Object),
    });
  });

  it('does not dispatch filtered signals when dependencies are missing', () => {
    const dispatch = jest.fn();
    const worker = new SignalsWorker(dispatch, {
      areHiddenSignalsVisible: false,
      externalData: faker.opossum.attributionData(),
      resolvedExternalAttributions: faker.opossum.resolvedAttributions(),
      signalFilters: [],
      signalSearch: '',
      signalSelectedLicense: '',
    });

    worker.processInput({
      name: 'resourceId',
      data: faker.opossum.resourceName(),
    });

    expect(dispatch).not.toHaveBeenCalledWith<[SignalsWorkerOutput]>({
      name: 'filteredSignals',
      data: expect.any(Object),
    });
  });

  it('dispatches progress data when dependencies are met', () => {
    const dispatch = jest.fn();
    const worker = new SignalsWorker(dispatch, {
      attributionBreakpoints: new Set<string>(),
      externalData: faker.opossum.attributionData(),
      filesWithChildren: new Set<string>(),
      manualData: faker.opossum.attributionData(),
      resolvedExternalAttributions: new Set<string>(),
    });

    worker.processInput({
      name: 'resources',
      data: faker.opossum.resources(),
    });

    expect(dispatch).toHaveBeenCalledWith<[SignalsWorkerOutput]>({
      name: 'progressData',
      data: expect.any(Object),
    });
  });

  it('does not dispatch progress data when dependencies are missing', () => {
    const dispatch = jest.fn();
    const worker = new SignalsWorker(dispatch, {
      attributionBreakpoints: new Set<string>(),
      externalData: faker.opossum.attributionData(),
      filesWithChildren: new Set<string>(),
      manualData: faker.opossum.attributionData(),
    });

    worker.processInput({
      name: 'resources',
      data: faker.opossum.resources(),
    });

    expect(dispatch).not.toHaveBeenCalledWith<[SignalsWorkerOutput]>({
      name: 'progressData',
      data: expect.any(Object),
    });
  });
});
