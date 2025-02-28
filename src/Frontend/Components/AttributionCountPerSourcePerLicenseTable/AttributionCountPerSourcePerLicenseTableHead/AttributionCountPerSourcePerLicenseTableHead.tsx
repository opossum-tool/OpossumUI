// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiTableCell from '@mui/material/TableCell';
import MuiTableHead from '@mui/material/TableHead';
import MuiTableRow from '@mui/material/TableRow';

import { text } from '../../../../shared/text';
import { tableClasses } from '../../../shared-styles';

interface AttributionCountPerSourcePerLicenseTableHeadProps {
  sourceNames: Array<string>;
}

export const AttributionCountPerSourcePerLicenseTableHead: React.FC<
  AttributionCountPerSourcePerLicenseTableHeadProps
> = (props) => {
  const componentText = text.attributionCountPerSourcePerLicenseTable;

  const headerRow = [
    componentText.columnNames.licenseName,
    componentText.columnNames.criticality.title,
    ...props.sourceNames,
    componentText.columnNames.totalSources,
  ].map(
    (sourceName) => sourceName.charAt(0).toUpperCase() + sourceName.slice(1),
  );

  return (
    <MuiTableHead>
      <MuiTableRow>
        {headerRow.map((columnHeader, columnIndex) => (
          <MuiTableCell
            sx={tableClasses.head}
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
