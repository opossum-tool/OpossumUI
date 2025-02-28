// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiTableCell from '@mui/material/TableCell';
import MuiTableRow from '@mui/material/TableRow';

import { Criticality } from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { tableClasses } from '../../../shared-styles';
import { CriticalityIcon } from '../../Icons/Icons';

interface AttributionCountPerSourcePerLicenseTableRowProps {
  sourceNames: Array<string>;
  signalCountsPerSource: { [sourceName: string]: number };
  licenseName: string;
  licenseCriticality: Criticality | undefined;
  totalSignalCount: number;
}

export const AttributionCountPerSourcePerLicenseTableRow: React.FC<
  AttributionCountPerSourcePerLicenseTableRowProps
> = (props) => {
  return (
    <MuiTableRow>
      <MuiTableCell sx={tableClasses.body} align={'left'}>
        {props.licenseName}
      </MuiTableCell>
      {renderCriticalityCell()}
      {props.sourceNames.map((sourceName, sourceIdx) => (
        <MuiTableCell sx={tableClasses.body} align={'center'} key={sourceIdx}>
          {props.signalCountsPerSource[sourceName] || '-'}
        </MuiTableCell>
      ))}
      <MuiTableCell sx={tableClasses.body} align={'center'}>
        {props.totalSignalCount}
      </MuiTableCell>
    </MuiTableRow>
  );

  function renderCriticalityCell() {
    return (
      <MuiTableCell sx={tableClasses.body} align={'center'}>
        {props.licenseCriticality === undefined ? (
          '-'
        ) : (
          <CriticalityIcon
            criticality={props.licenseCriticality}
            tooltip={
              props.licenseCriticality === Criticality.High
                ? text.attributionCountPerSourcePerLicenseTable.columnNames
                    .criticality.high
                : text.attributionCountPerSourcePerLicenseTable.columnNames
                    .criticality.medium
            }
          />
        )}
      </MuiTableCell>
    );
  }
};
