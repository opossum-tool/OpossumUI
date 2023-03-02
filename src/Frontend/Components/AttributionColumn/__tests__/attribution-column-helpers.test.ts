// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { View } from '../../../enums/enums';
import {
  getLicenseTextMaxRows,
  getMergeButtonsDisplayState,
  selectedPackageIsResolved,
} from '../attribution-column-helpers';

describe('The AttributionColumn helpers', () => {
  const windowHeight = 1080;

  it('getLicenseTextMaxRows in audit view', () => {
    const expectedLicenseTextMaxRows = 29;
    expect(getLicenseTextMaxRows(windowHeight, View.Audit)).toEqual(
      expectedLicenseTextMaxRows
    );
  });

  it('getLicenseTextMaxRows in attribution view', () => {
    const expectedLicenseTextMaxRows = 31;
    expect(getLicenseTextMaxRows(windowHeight, View.Attribution)).toEqual(
      expectedLicenseTextMaxRows
    );
  });

  it('selectedPackageIsResolved returns true', () => {
    expect(
      selectedPackageIsResolved('123', new Set<string>().add('123'))
    ).toEqual(true);
  });

  it('selectedPackageIsResolved returns false if empty attributionId', () => {
    expect(selectedPackageIsResolved('', new Set<string>().add('123'))).toEqual(
      false
    );
  });

  it('selectedPackageIsResolved returns false if id does not match', () => {
    expect(
      selectedPackageIsResolved('123', new Set<string>().add('321'))
    ).toEqual(false);
  });
});

describe('getMergeButtonsDisplayState', () => {
  it('does not show buttons when external attribution', () => {
    expect(
      getMergeButtonsDisplayState({
        attributionIdMarkedForReplacement: '',
        targetAttributionId: 'attr',
        selectedAttributionId: '',
        packageInfoWereModified: false,
        targetAttributionIsPreSelected: false,
        targetAttributionIsExternalAttribution: true,
      })
    ).toStrictEqual({
      hideMarkForReplacementButton: true,
      hideUnmarkForReplacementButton: true,
      hideReplaceMarkedByButton: true,
      deactivateReplaceMarkedByButton: false,
    });
  });

  it('does show markForReplacementButton when another attribution is selected for replacement', () => {
    expect(
      getMergeButtonsDisplayState({
        attributionIdMarkedForReplacement: 'other_attr',
        targetAttributionId: 'attr',
        selectedAttributionId: 'attr',
        packageInfoWereModified: false,
        targetAttributionIsPreSelected: false,
        targetAttributionIsExternalAttribution: false,
      })
    ).toStrictEqual({
      hideMarkForReplacementButton: false,
      hideUnmarkForReplacementButton: true,
      hideReplaceMarkedByButton: false,
      deactivateReplaceMarkedByButton: false,
    });
  });

  it('shows unMarkForReplacementButton when attribution is already selected for replacement', () => {
    expect(
      getMergeButtonsDisplayState({
        attributionIdMarkedForReplacement: 'attr',
        targetAttributionId: 'attr',
        selectedAttributionId: 'attr',
        packageInfoWereModified: false,
        targetAttributionIsPreSelected: false,
        targetAttributionIsExternalAttribution: false,
      })
    ).toStrictEqual({
      hideMarkForReplacementButton: true,
      hideUnmarkForReplacementButton: false,
      hideReplaceMarkedByButton: true,
      deactivateReplaceMarkedByButton: false,
    });
  });

  it('does not show unMarkForReplacementButton when attribution is not selected', () => {
    expect(
      getMergeButtonsDisplayState({
        attributionIdMarkedForReplacement: '',
        targetAttributionId: 'attr',
        selectedAttributionId: 'attr',
        packageInfoWereModified: false,
        targetAttributionIsPreSelected: false,
        targetAttributionIsExternalAttribution: false,
      })
    ).toStrictEqual({
      hideMarkForReplacementButton: false,
      hideUnmarkForReplacementButton: true,
      hideReplaceMarkedByButton: true,
      deactivateReplaceMarkedByButton: false,
    });
  });

  it('deactivates ReplaceMarkedByButton when selectedAttribution part of replacement and packageInfo were modified', () => {
    expect(
      getMergeButtonsDisplayState({
        attributionIdMarkedForReplacement: 'attr2',
        targetAttributionId: 'attr',
        selectedAttributionId: 'attr',
        packageInfoWereModified: true,
        targetAttributionIsPreSelected: false,
        targetAttributionIsExternalAttribution: false,
      })
    ).toStrictEqual({
      hideMarkForReplacementButton: false,
      hideUnmarkForReplacementButton: true,
      hideReplaceMarkedByButton: false,
      deactivateReplaceMarkedByButton: true,
    });
  });

  it('enables ReplaceMarkedByButton when selectedAttribution not part of replacement and packageInfo were modified', () => {
    expect(
      getMergeButtonsDisplayState({
        attributionIdMarkedForReplacement: 'attr2',
        targetAttributionId: 'attr1',
        selectedAttributionId: 'attr',
        packageInfoWereModified: true,
        targetAttributionIsPreSelected: false,
        targetAttributionIsExternalAttribution: false,
      })
    ).toStrictEqual({
      hideMarkForReplacementButton: false,
      hideUnmarkForReplacementButton: true,
      hideReplaceMarkedByButton: false,
      deactivateReplaceMarkedByButton: false,
    });
  });

  it('deactivates ReplaceMarkedByButton when attribution is preselected', () => {
    expect(
      getMergeButtonsDisplayState({
        attributionIdMarkedForReplacement: 'attr2',
        targetAttributionId: 'attr',
        selectedAttributionId: 'attr',
        packageInfoWereModified: false,
        targetAttributionIsPreSelected: true,
        targetAttributionIsExternalAttribution: false,
      })
    ).toStrictEqual({
      hideMarkForReplacementButton: false,
      hideUnmarkForReplacementButton: true,
      hideReplaceMarkedByButton: false,
      deactivateReplaceMarkedByButton: true,
    });
  });
});
