// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiTableCell from '@mui/material/TableCell';
import MuiTableFooter from '@mui/material/TableFooter';
import MuiTableRow from '@mui/material/TableRow';
import { sum } from 'lodash';

import { text } from '../../../../shared/text';
import { tableClasses } from '../../../shared-styles';
import {
  Column,
  ColumnConfig,
  SingleColumn,
} from '../AttributionCountPerSourcePerLicenseTable.util';

interface AttributionCountPerSourcePerLicenseTableFooterProps {
  columnConfig: ColumnConfig;
  totalAttributionsPerSource: { [sourceName: string]: number };
}

export const AttributionCountPerSourcePerLicenseTableFooter: React.FC<
  AttributionCountPerSourcePerLicenseTableFooterProps
> = (props) => {
  return (
    <MuiTableFooter>
      <MuiTableRow sx={tableClasses.footer}>
        {props.columnConfig.getColumns().map((column, columnIdx) => {
          return (
            <MuiTableCell
              sx={tableClasses.footer}
              key={columnIdx}
              align={column.align}
            >
              <FooterCellContent
                column={column}
                totalAttributionsPerSource={props.totalAttributionsPerSource}
              />
            </MuiTableCell>
          );
        })}
      </MuiTableRow>
    </MuiTableFooter>
  );
};

interface FooterCellContentProps {
  column: Column;
  totalAttributionsPerSource: { [sourceName: string]: number };
}

const FooterCellContent: React.FC<FooterCellContentProps> = (props) => {
  if (props.column.columnType === SingleColumn.NAME) {
    return text.attributionCountPerSourcePerLicenseTable.footerTitle;
  } else if (
    props.column.columnType === SingleColumn.CRITICALITY ||
    props.column.columnType === SingleColumn.CLASSIFICATION
  ) {
    return null;
  } else if (props.column.columnType === SingleColumn.TOTAL) {
    return sum(Object.values(props.totalAttributionsPerSource));
  }

  return props.totalAttributionsPerSource[props.column.columnType.sourceName];
};
