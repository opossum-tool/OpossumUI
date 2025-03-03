// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiTableCell from '@mui/material/TableCell';
import MuiTableRow from '@mui/material/TableRow';

import { Criticality } from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { OpossumColors, tableClasses } from '../../../shared-styles';
import { useAppSelector } from '../../../state/hooks';
import { getClassifications } from '../../../state/selectors/resource-selectors';
import { CriticalityIcon } from '../../Icons/Icons';
import {
  Column,
  ColumnConfig,
  SingleColumn,
} from '../AttributionCountPerSourcePerLicenseTable.util';

interface AttributionCountPerSourcePerLicenseTableRowProps {
  columnConfig: ColumnConfig;
  signalCountsPerSource: { [sourceName: string]: number };
  licenseName: string;
  licenseCriticality: Criticality | undefined;
  licenseClassification: number | undefined;
  totalSignalCount: number;
  rowIndex: number;
}

export const AttributionCountPerSourcePerLicenseTableRow: React.FC<
  AttributionCountPerSourcePerLicenseTableRowProps
> = (props) => {
  const bodyClassWithBackgroundColor = {
    ...tableClasses.body,
    backgroundColor:
      props.rowIndex % 2 === 0
        ? OpossumColors.lightestBlue
        : OpossumColors.almostWhiteBlue,
  };

  return (
    <MuiTableRow>
      {props.columnConfig.getColumns().map((column, columnIdx) => {
        return (
          <MuiTableCell
            sx={bodyClassWithBackgroundColor}
            key={columnIdx}
            data-testid={`signalsPerSourceBodyCell${columnIdx}`}
            align={column.align}
          >
            <RowCellContent
              signalCountsPerSource={props.signalCountsPerSource}
              licenseName={props.licenseName}
              licenseCriticality={props.licenseCriticality}
              licenseClassification={props.licenseClassification}
              totalSignalCount={props.totalSignalCount}
              column={column}
            />
          </MuiTableCell>
        );
      })}
    </MuiTableRow>
  );
};

interface RowCellContentProps {
  signalCountsPerSource: { [sourceName: string]: number };
  licenseName: string;
  licenseCriticality: Criticality | undefined;
  licenseClassification: number | undefined;
  totalSignalCount: number;
  column: Column;
}

const RowCellContent: React.FC<RowCellContentProps> = (props) => {
  const componentText = text.attributionCountPerSourcePerLicenseTable;

  const classifications = useAppSelector(getClassifications);

  if (props.column.columnType === SingleColumn.NAME) {
    return props.licenseName;
  } else if (props.column.columnType === SingleColumn.CRITICALITY) {
    return props.licenseCriticality === undefined ? (
      componentText.none
    ) : (
      <CriticalityIcon
        criticality={props.licenseCriticality}
        tooltip={
          props.licenseCriticality === Criticality.High
            ? componentText.columns.criticality.high
            : componentText.columns.criticality.medium
        }
      />
    );
  } else if (props.column.columnType === SingleColumn.CLASSIFICATION) {
    return props.licenseClassification
      ? (classifications[props.licenseClassification] ?? componentText.none)
      : componentText.none;
  } else if (props.column.columnType === SingleColumn.TOTAL) {
    return props.totalSignalCount;
  }

  return (
    props.signalCountsPerSource[props.column.columnType.sourceName] ||
    componentText.none
  );
};
