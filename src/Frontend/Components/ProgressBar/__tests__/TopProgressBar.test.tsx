// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { act, fireEvent, screen } from '@testing-library/react';
import React from 'react';
import {
  Attributions,
  Criticality,
  DiscreteConfidence,
  PackageInfo,
  Resources,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import {
  createTestAppStore,
  renderComponentWithStore,
} from '../../../test-helpers/render-component-with-store';
import { TopProgressBar } from '../TopProgressBar';
import {
  setResources,
  setManualData,
  setExternalData,
  setAttributionBreakpoints,
  setFilesWithChildren,
} from '../../../state/actions/resource-actions/all-views-simple-actions';
import { setResolvedExternalAttributions } from '../../../state/actions/resource-actions/audit-view-simple-actions';

describe('TopProgressBar', () => {
  jest.useFakeTimers();
  it('TopProgressBar renders', () => {
    const testResources: Resources = {
      folder1: { file1: 1, file2: 1 },
      folder2: { file1: 1, file2: 1 },
      file1: 1,
      file2: 1,
    };

    const testManualAttributionUuid_1 = '4d9f0b16-fbff-11ea-adc1-0242ac120002';
    const testManualAttributionUuid_2 = 'b5da73d4-f400-11ea-adc1-0242ac120002';
    const testExternalAttributionUuid = 'b5da73d4-f400-11ea-adc1-0242ac120003';
    const testPackageInfo: PackageInfo = {
      attributionConfidence: DiscreteConfidence.High,
      packageVersion: '1.0',
      packageName: 'test Package',
      licenseText: ' test License text',
    };
    const secondTestPackageInfo: PackageInfo = {
      packageVersion: '2.0',
      packageName: 'not assigned test Package',
      licenseText: ' test not assigned License text',
      preSelected: true,
    };
    const testManualAttributions: Attributions = {
      [testManualAttributionUuid_1]: testPackageInfo,
      [testManualAttributionUuid_2]: secondTestPackageInfo,
    };

    const testExternalAttributions: Attributions = {
      [testExternalAttributionUuid]: {
        packageName: 'React',
        packageVersion: '17.0.0',
      },
    };

    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/folder1/': [testManualAttributionUuid_1],
      '/folder2/file1': [testManualAttributionUuid_1],
      '/file1': [testManualAttributionUuid_2],
    };
    const testResourcesToExternalAttributions: ResourcesToAttributions = {
      '/folder1/file2': [testExternalAttributionUuid],
      '/folder2/file2': [testExternalAttributionUuid],
    };

    const testStore = createTestAppStore();

    testStore.dispatch(setResources(testResources));
    testStore.dispatch(
      setManualData(testManualAttributions, testResourcesToManualAttributions)
    );
    testStore.dispatch(
      setExternalData(
        testExternalAttributions,
        testResourcesToExternalAttributions
      )
    );
    testStore.dispatch(setResolvedExternalAttributions(new Set()));
    testStore.dispatch(setAttributionBreakpoints(new Set()));
    testStore.dispatch(setFilesWithChildren(new Set()));

    renderComponentWithStore(<TopProgressBar />, {
      store: testStore,
    });

    const progressBar = screen.getByLabelText('TopProgressBar');
    fireEvent.mouseOver(progressBar);
    act(() => {
      jest.runAllTimers();
    });
    expect(screen.getByText(/Number of files: 6/)).toBeInTheDocument();
    expect(
      screen.getByText(/Files with attributions: 3/) &&
        screen.getByText(/Files with only pre-selected attributions: 1/) &&
        screen.getByText(/Files with only signals: 1/)
    ).toBeDefined();
  });

  it('TopProgressBar renders in criticality view', () => {
    const testResources: Resources = {
      folder1: { file1: 1, file2: 1 },
      folder2: { file1: 1, file2: 1 },
      folder3: { file1: 1, file2: 1 },
      file1: 1,
      file2: 1,
    };

    const testManualAttributionUuid_1 = '4d9f0b16-fbff-11ea-adc1-0242ac120002';
    const testManualAttributionUuid_2 = 'b5da73d4-f400-11ea-adc1-0242ac120002';

    const testPackageInfo: PackageInfo = {
      attributionConfidence: DiscreteConfidence.High,
      packageVersion: '1.0',
      packageName: 'test Package',
      licenseText: ' test License text',
    };
    const secondTestPackageInfo: PackageInfo = {
      packageVersion: '2.0',
      packageName: 'not assigned test Package',
      licenseText: ' test not assigned License text',
      preSelected: true,
    };
    const testManualAttributions: Attributions = {
      [testManualAttributionUuid_1]: testPackageInfo,
      [testManualAttributionUuid_2]: secondTestPackageInfo,
    };

    const testHighlyCriticalExternalAttributionUuid =
      'ed8d3fa1-a53c-42c9-8e48-8f02382b3413';
    const testMediumCriticalExternalAttributionUuid =
      'c4b2fd5c-b5e6-4835-8d21-863f89169892';
    const testNonCriticalExternalAttributionUuid =
      'a79fbc27-5fe2-4121-b0d5-365dcab151ff';
    const testNotRelevantForCriticalViewAttributionUuid =
      'a09f455f-efe3-4347-bfd1-cec0f040a96f';

    const testHighlyCriticalExternalAttributionPackageInfo: PackageInfo = {
      attributionConfidence: DiscreteConfidence.High,
      packageVersion: '1.0',
      packageName: 'highly critical package',
      licenseText: 'license text of highly critical package',
      criticality: Criticality.High,
    };

    const testMediumCriticalExternalAttributionPackageInfo: PackageInfo = {
      attributionConfidence: DiscreteConfidence.High,
      packageVersion: '2.0',
      packageName: 'medium critical package',
      licenseText: 'license text of medium critical package',
      criticality: Criticality.Medium,
    };

    const testNonCriticalExternalAttributionPackageInfo: PackageInfo = {
      attributionConfidence: DiscreteConfidence.High,
      packageVersion: '3.0',
      packageName: 'non critical package',
      licenseText: 'license text of non critical package',
    };

    const testNotRelevantForCriticalViewAttributionPackageInfo: PackageInfo = {
      attributionConfidence: DiscreteConfidence.High,
      packageVersion: '4.0',
      packageName: 'not relevant for critical view package',
      licenseText: 'license text of not relevant for critical view package',
    };

    const testExternalAttributions: Attributions = {
      [testHighlyCriticalExternalAttributionUuid]:
        testHighlyCriticalExternalAttributionPackageInfo,
      [testMediumCriticalExternalAttributionUuid]:
        testMediumCriticalExternalAttributionPackageInfo,
      [testNonCriticalExternalAttributionUuid]:
        testNonCriticalExternalAttributionPackageInfo,
      [testNotRelevantForCriticalViewAttributionUuid]:
        testNotRelevantForCriticalViewAttributionPackageInfo,
    };

    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/folder1/': [testManualAttributionUuid_1],
      '/folder2/file1': [testManualAttributionUuid_1],
      '/file1': [testManualAttributionUuid_2],
    };
    const testResourcesToExternalAttributions: ResourcesToAttributions = {
      '/folder1/file2': [testNotRelevantForCriticalViewAttributionUuid],
      '/folder2/file2': [testNonCriticalExternalAttributionUuid],
      '/folder3/file1': [testMediumCriticalExternalAttributionUuid],
      '/folder3/file2': [testHighlyCriticalExternalAttributionUuid],
    };

    const testStore = createTestAppStore();

    testStore.dispatch(setResources(testResources));
    testStore.dispatch(
      setManualData(testManualAttributions, testResourcesToManualAttributions)
    );
    testStore.dispatch(
      setExternalData(
        testExternalAttributions,
        testResourcesToExternalAttributions
      )
    );
    testStore.dispatch(setResolvedExternalAttributions(new Set()));
    testStore.dispatch(setAttributionBreakpoints(new Set()));
    testStore.dispatch(setFilesWithChildren(new Set()));

    renderComponentWithStore(<TopProgressBar />, {
      store: testStore,
    });
    const criticalityStateSwitch = screen.getByLabelText(
      'CriticalityStateSwitch'
    ).children[0] as HTMLElement;
    fireEvent.click(criticalityStateSwitch);
    const progressBar = screen.getByLabelText('TopProgressBar');
    fireEvent.mouseOver(progressBar);
    act(() => {
      jest.runAllTimers();
    });
    expect(screen.getByText(/Files with only signals: 3/)).toBeInTheDocument();
    expect(
      screen.getByText(/Files with only highly critical signals: 1/) &&
        screen.getByText(/Files with only medium critical signals: 1/) &&
        screen.getByText(/Files with only non-critical signals: 1/)
    ).toBeDefined();
  });
});
