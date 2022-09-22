// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { OpossumColors } from '../../shared-styles';

export const projectStatisticsPopupClasses = {
  head: {
    fontSize: 13,
    background: OpossumColors.darkBlue,
    color: OpossumColors.white,
  },
  footer: {
    fontWeight: 'bold',
    fontSize: 12,
    background: OpossumColors.lightBlue,
  },
  body: {
    fontSize: 11,
    background: OpossumColors.lightestBlue,
  },
  attributionCountPerSourcePerLicenseTable: {
    maxHeight: '400px',
    marginBottom: 3,
  },
  attributionPropertyCountTable: {
    maxHeight: '100px',
    maxWidth: '400px',
    marginBottom: 3,
  },
  tableFooter: {
    position: 'sticky',
    bottom: 0,
  },
};
