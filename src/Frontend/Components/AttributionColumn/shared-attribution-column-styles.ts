// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { OpossumColors } from '../../shared-styles';

export const attributionColumnClasses = {
  panel: {
    marginBottom: '5px',
    padding: '6px',
    paddingBottom: '0px',
    background: OpossumColors.lightestBlue,
    border: `1px ${OpossumColors.lightestBlue} solid`,
  },
  displayRow: {
    display: 'flex',
    gap: '8px',
  },
  textBox: {
    marginBottom: '4px',
    flex: 1,
  },
};
