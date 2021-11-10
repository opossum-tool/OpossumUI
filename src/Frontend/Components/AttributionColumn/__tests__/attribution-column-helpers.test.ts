// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
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
  test('getLicenseTextMaxRows in audit view', () => {
    expect(getLicenseTextMaxRows(1080, View.Audit)).toEqual(35);
  });

  test('getLicenseTextMaxRows in attribution view', () => {
    expect(getLicenseTextMaxRows(1080, View.Attribution)).toEqual(37);
  });

  test('selectedPackageIsResolved returns true', () => {
    expect(
      selectedPackageIsResolved('123', new Set<string>().add('123'))
    ).toEqual(true);
  });

  test('selectedPackageIsResolved returns false if empty attributionId', () => {
    expect(selectedPackageIsResolved('', new Set<string>().add('123'))).toEqual(
      false
    );
  });

  test('selectedPackageIsResolved returns false if id does not match', () => {
    expect(
      selectedPackageIsResolved('123', new Set<string>().add('321'))
    ).toEqual(false);
  });
});

describe('getMergeButtonsDisplayState', () => {
  it('does not show buttons when in table view', () => {
    expect(
      getMergeButtonsDisplayState(View.Audit, '', '', '', false, false, false)
    ).toStrictEqual({
      hideMarkForReplacementButton: true,
      hideUnmarkForReplacementButton: true,
      hideOnReplaceMarkedByButton: true,
      deactivateReplaceMarkedByButton: false,
    });
  });

  it('does not show buttons when external attribution', () => {
    expect(
      getMergeButtonsDisplayState(
        View.Audit,
        '',
        'attr',
        '',
        false,
        false,
        true
      )
    ).toStrictEqual({
      hideMarkForReplacementButton: true,
      hideUnmarkForReplacementButton: true,
      hideOnReplaceMarkedByButton: true,
      deactivateReplaceMarkedByButton: false,
    });
  });

  it('does show markForReplacementButton when another attribution is selected for replacement', () => {
    expect(
      getMergeButtonsDisplayState(
        View.Attribution,
        'other_attr',
        'attr',
        'attr',
        false,
        false,
        false
      )
    ).toStrictEqual({
      hideMarkForReplacementButton: false,
      hideUnmarkForReplacementButton: true,
      hideOnReplaceMarkedByButton: false,
      deactivateReplaceMarkedByButton: false,
    });
  });

  it('shows unMarkForReplacementButton when attribution is already selected for replacement', () => {
    expect(
      getMergeButtonsDisplayState(
        View.Attribution,
        'attr',
        'attr',
        'attr',
        false,
        false,
        false
      )
    ).toStrictEqual({
      hideMarkForReplacementButton: true,
      hideUnmarkForReplacementButton: false,
      hideOnReplaceMarkedByButton: true,
      deactivateReplaceMarkedByButton: false,
    });
  });

  it('does not show unMarkForReplacementButton when attribution is not selected', () => {
    expect(
      getMergeButtonsDisplayState(
        View.Attribution,
        '',
        'attr',
        'attr',
        false,
        false,
        false
      )
    ).toStrictEqual({
      hideMarkForReplacementButton: false,
      hideUnmarkForReplacementButton: true,
      hideOnReplaceMarkedByButton: true,
      deactivateReplaceMarkedByButton: false,
    });
  });

  it('deactivates ReplaceMarkedByButton when selectedAttribution part of replacement and packageInfo were modified', () => {
    expect(
      getMergeButtonsDisplayState(
        View.Attribution,
        'attr2',
        'attr',
        'attr',
        true,
        false,
        false
      )
    ).toStrictEqual({
      hideMarkForReplacementButton: false,
      hideUnmarkForReplacementButton: true,
      hideOnReplaceMarkedByButton: false,
      deactivateReplaceMarkedByButton: true,
    });
  });

  it('enables ReplaceMarkedByButton when selectedAttribution not part of replacement and packageInfo were modified', () => {
    expect(
      getMergeButtonsDisplayState(
        View.Attribution,
        'attr2',
        'attr1',
        'attr',
        true,
        false,
        false
      )
    ).toStrictEqual({
      hideMarkForReplacementButton: false,
      hideUnmarkForReplacementButton: true,
      hideOnReplaceMarkedByButton: false,
      deactivateReplaceMarkedByButton: false,
    });
  });

  it('deactivates ReplaceMarkedByButton when attribution is preselected', () => {
    expect(
      getMergeButtonsDisplayState(
        View.Attribution,
        'attr2',
        'attr',
        'attr',
        false,
        true,
        false
      )
    ).toStrictEqual({
      hideMarkForReplacementButton: false,
      hideUnmarkForReplacementButton: true,
      hideOnReplaceMarkedByButton: false,
      deactivateReplaceMarkedByButton: true,
    });
  });
});
