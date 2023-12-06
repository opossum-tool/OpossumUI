// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker } from '../../../shared/Faker';
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

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith<[SignalsWorkerOutput]>({
      name: 'autocompleteSignals',
      data: [],
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

    expect(dispatch).not.toHaveBeenCalled();
  });
});
