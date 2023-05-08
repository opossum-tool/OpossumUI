// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { PackagePanelTitle, View } from '../../../enums/enums';
import { ADD_NEW_ATTRIBUTION_BUTTON_ID } from '../../../shared-constants';
import { PanelPackage } from '../../../types/types';
import {
  getLicenseTextMaxRows,
  getMergeButtonsDisplayState,
  getSelectedManualAttributionIdForAuditView,
  selectedPackagesAreResolved,
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
      selectedPackagesAreResolved(['123'], new Set<string>().add('123'))
    ).toEqual(true);
  });

  it('selectedPackageIsResolved returns false if empty attributionId', () => {
    expect(
      selectedPackagesAreResolved([''], new Set<string>().add('123'))
    ).toEqual(false);
  });

  it('selectedPackageIsResolved returns false if empty array of attributionIds', () => {
    expect(
      selectedPackagesAreResolved([], new Set<string>().add('123'))
    ).toEqual(false);
  });

  it('selectedPackageIsResolved returns false if id does not match', () => {
    expect(
      selectedPackagesAreResolved(['123'], new Set<string>().add('321'))
    ).toEqual(false);
  });

  it('selectedPackageIsResolved returns false if only a subset matches', () => {
    expect(
      selectedPackagesAreResolved(['123', '456'], new Set<string>().add('123'))
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

describe('getSelectedManualAttributionIdForAuditView', () => {
  it('yields correct attributionId if manual panel', () => {
    const testSelectedPackage: PanelPackage = {
      panel: PackagePanelTitle.ManualPackages,
      packageCardId: 'somePackageCardId',
      displayPackageInfo: { packageName: 'React', attributionIds: ['uuid'] },
    };
    const expectedSelectedManaualAttributionId = 'uuid';
    const testSelectedManualAttributionId =
      getSelectedManualAttributionIdForAuditView(testSelectedPackage);
    expect(testSelectedManualAttributionId).toEqual(
      expectedSelectedManaualAttributionId
    );
  });

  it('yields empty string if external panel', () => {
    const testSelectedPackage: PanelPackage = {
      panel: PackagePanelTitle.ContainedExternalPackages,
      packageCardId: 'somePackageCardId',
      displayPackageInfo: { packageName: 'React', attributionIds: ['uuid'] },
    };
    const expectedSelectedManaualAttributionId = '';
    const testSelectedManualAttributionId =
      getSelectedManualAttributionIdForAuditView(testSelectedPackage);
    expect(testSelectedManualAttributionId).toEqual(
      expectedSelectedManaualAttributionId
    );
  });

  it('yields empty string if packageCardId is from addNewAttribution button', () => {
    const testSelectedPackage: PanelPackage = {
      panel: PackagePanelTitle.ManualPackages,
      packageCardId: ADD_NEW_ATTRIBUTION_BUTTON_ID,
      displayPackageInfo: { packageName: 'React', attributionIds: ['uuid'] },
    };
    const expectedSelectedManaualAttributionId = '';
    const testSelectedManualAttributionId =
      getSelectedManualAttributionIdForAuditView(testSelectedPackage);
    expect(testSelectedManualAttributionId).toEqual(
      expectedSelectedManaualAttributionId
    );
  });

  it('yields empty string if panel package is null', () => {
    const testSelectedPackage = null;
    const expectedSelectedManaualAttributionId = '';
    const testSelectedManualAttributionId =
      getSelectedManualAttributionIdForAuditView(testSelectedPackage);
    expect(testSelectedManualAttributionId).toEqual(
      expectedSelectedManaualAttributionId
    );
  });
});
