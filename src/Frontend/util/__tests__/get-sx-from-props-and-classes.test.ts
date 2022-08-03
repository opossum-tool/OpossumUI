// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  getSxFromPropsAndClasses,
  MuiSx,
} from '../get-sx-from-props-and-classes';
import { SxProps } from '@mui/material';
import { SystemStyleObject } from '@mui/system/styleFunctionSx';

describe('getSxFromPropsAndClasses', () => {
  it('takes styleClass as only input', () => {
    const testStyleClass: SystemStyleObject = { padding: '6px' };
    const expectedSx: MuiSx = [testStyleClass, {}];

    expect(getSxFromPropsAndClasses({ styleClass: testStyleClass })).toEqual(
      expectedSx
    );
  });

  it('takes sxProps object as only input', () => {
    const testSxProps: SxProps = { margin: '12px' };
    const expectedSx: MuiSx = [{}, testSxProps];

    expect(getSxFromPropsAndClasses({ sxProps: testSxProps })).toEqual(
      expectedSx
    );
  });

  it('takes sxProps array as only input', () => {
    const testSxProps: SxProps = [{ margin: '12px' }, { border: '1.5px' }];
    const expectedSx: MuiSx = [{}, ...testSxProps];

    expect(getSxFromPropsAndClasses({ sxProps: testSxProps })).toEqual(
      expectedSx
    );
  });

  it('takes styleClass and sxProps as input', () => {
    const testStyleClass: SystemStyleObject = { padding: '6px' };
    const testSxProps: SxProps = { margin: '12px' };
    const expectedSx: MuiSx = [testStyleClass, testSxProps];

    expect(
      getSxFromPropsAndClasses({
        styleClass: testStyleClass,
        sxProps: testSxProps,
      })
    ).toEqual(expectedSx);
  });
});
