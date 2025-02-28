// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiTableCell from '@mui/material/TableCell';
import MuiTableHead from '@mui/material/TableHead';
import MuiTableRow from '@mui/material/TableRow';

import { text } from '../../../../shared/text';
import { tableClasses } from '../../../shared-styles';

const classes = {
  headerCellWithVerticalSeparator: {
    borderRight: '2px solid lightgray',
  },
  headerCellWithHorizontalSeparator: {
    borderBottom: '1.5px solid lightgray',
  },
};

interface AttributionCountPerSourcePerLicenseTableHeadProps {
  sourceNames: Array<string>;
}

export const AttributionCountPerSourcePerLicenseTableHead: React.FC<
  AttributionCountPerSourcePerLicenseTableHeadProps
> = (props) => {
  const componentText = text.attributionCountPerSourcePerLicenseTable;

  const headerRow = [
    componentText.columns.licenseName,
    componentText.columns.criticality.title,
    componentText.columns.classification,
    ...props.sourceNames.map(
      (sourceName) => sourceName.charAt(0).toUpperCase() + sourceName.slice(1),
    ),
    componentText.columns.totalSources,
  ];

  return (
    <MuiTableHead sx={{ position: 'sticky', top: 0 }}>
      <MuiTableRow>
        <MuiTableCell
          sx={{
            ...tableClasses.head,
            ...classes.headerCellWithVerticalSeparator,
            ...classes.headerCellWithHorizontalSeparator,
          }}
          align={'center'}
          colSpan={3}
        >
          {componentText.columns.licenseInfo}
        </MuiTableCell>
        <MuiTableCell
          sx={{
            ...tableClasses.head,
            ...classes.headerCellWithHorizontalSeparator,
          }}
          align={'center'}
          colSpan={props.sourceNames.length + 1}
        >
          {componentText.columns.signalCountPerSource}
        </MuiTableCell>
      </MuiTableRow>
      <MuiTableRow>
        {headerRow.map((columnHeader, columnIndex) => (
          <MuiTableCell
            sx={{
              ...tableClasses.head,
              ...(columnIndex === 2
                ? classes.headerCellWithVerticalSeparator
                : {}),
            }}
            key={columnIndex}
            align={columnIndex === 0 ? 'left' : 'center'}
          >
            {columnHeader}
          </MuiTableCell>
        ))}
      </MuiTableRow>
    </MuiTableHead>
  );
};
