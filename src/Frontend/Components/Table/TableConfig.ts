// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { AttributionInfo } from '../../../shared/shared-types';

export interface TableConfig {
  attributionProperty: keyof AttributionInfo | 'icons';
  displayName: string;
  width?: 'verySmall' | 'small' | 'medium' | 'wide';
}

export const tableConfigs: Array<TableConfig> = [
  {
    attributionProperty: 'icons',
    displayName: '',
    width: 'verySmall',
  },
  {
    attributionProperty: 'packageName',
    displayName: 'Name',
    width: 'small',
  },
  {
    attributionProperty: 'packageVersion',
    displayName: 'Version',
    width: 'small',
  },
  {
    attributionProperty: 'licenseName',
    displayName: 'License',
    width: 'small',
  },
  {
    attributionProperty: 'licenseText',
    displayName: 'License Text',
    width: 'wide',
  },
  { attributionProperty: 'url', displayName: 'URL', width: 'medium' },
  {
    attributionProperty: 'resources',
    displayName: 'Resources',
    width: 'medium',
  },
  {
    attributionProperty: 'copyright',
    displayName: 'Copyright',
    width: 'medium',
  },
  {
    attributionProperty: 'attributionConfidence',
    displayName: 'Confidence',
    width: 'small',
  },
  { attributionProperty: 'comment', displayName: 'Comment', width: 'small' },
];
