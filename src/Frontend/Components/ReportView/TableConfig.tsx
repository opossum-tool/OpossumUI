// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { TableComponents } from 'react-virtuoso';

import { PackageInfo } from '../../../shared/shared-types';
import { useAppSelector } from '../../state/hooks';
import { getSelectedAttributionId } from '../../state/selectors/resource-selectors';
import { TableFilterButton } from './TableFilterButton';

const COLUMN_WIDTHS = {
  verySmall: '40px',
  small: '100px',
  medium: '320px',
  wide: '460px',
};

export interface TableConfig {
  attributionProperty: keyof PackageInfo;
  displayName: React.ReactNode;
  width: string;
}

export const tableConfigs: Array<TableConfig> = [
  {
    attributionProperty: 'id',
    displayName: <TableFilterButton />,
    width: COLUMN_WIDTHS.verySmall,
  },
  {
    attributionProperty: 'packageName',
    displayName: 'Name',
    width: COLUMN_WIDTHS.medium,
  },
  {
    attributionProperty: 'packageVersion',
    displayName: 'Version',
    width: COLUMN_WIDTHS.small,
  },
  {
    attributionProperty: 'licenseName',
    displayName: 'License',
    width: COLUMN_WIDTHS.medium,
  },
  {
    attributionProperty: 'licenseText',
    displayName: 'License Text',
    width: COLUMN_WIDTHS.wide,
  },
  {
    attributionProperty: 'url',
    displayName: 'Upstream Address',
    width: COLUMN_WIDTHS.medium,
  },
  {
    attributionProperty: 'copyright',
    displayName: 'Copyright',
    width: COLUMN_WIDTHS.medium,
  },
  {
    attributionProperty: 'attributionConfidence',
    displayName: 'Confidence',
    width: COLUMN_WIDTHS.small,
  },
  {
    attributionProperty: 'comment',
    displayName: 'Comment',
    width: COLUMN_WIDTHS.wide,
  },
];

// Virtuoso components must not be inlined: https://github.com/petyosi/react-virtuoso/issues/566
export const TABLE_COMPONENTS: TableComponents<PackageInfo> = {
  Scroller: (props) => <TableContainer {...props} />,
  Table: (props) => (
    <Table
      size={'small'}
      padding={'none'}
      {...props}
      style={{ borderCollapse: 'separate' }}
    />
  ),
  TableHead: (props) => <TableHead {...props} />,
  TableRow: (props) => {
    const selectedAttributionId = useAppSelector(getSelectedAttributionId);

    return (
      <TableRow
        hover
        selected={props.item.id === selectedAttributionId}
        {...props}
      />
    );
  },
  TableBody: (props) => <TableBody {...props} />,
};
