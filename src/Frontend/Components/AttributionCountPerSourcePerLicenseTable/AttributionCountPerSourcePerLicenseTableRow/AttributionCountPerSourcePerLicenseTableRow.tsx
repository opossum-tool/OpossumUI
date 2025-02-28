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

interface AttributionCountPerSourcePerLicenseTableRowProps {
  sourceNames: Array<string>;
  signalCountsPerSource: { [sourceName: string]: number };
  licenseName: string;
  licenseCriticality: Criticality | undefined;
  licenseClassification: number | undefined;
  totalSignalCount: number;
  key: React.Key;
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

  const componentText = text.attributionCountPerSourcePerLicenseTable;

  const classifications = useAppSelector(getClassifications);

  return (
    <MuiTableRow>
      <MuiTableCell sx={bodyClassWithBackgroundColor} align={'left'}>
        {props.licenseName}
      </MuiTableCell>
      {renderCriticalityCell()}
      {renderClassificationCell()}
      {props.sourceNames.map((sourceName, sourceIdx) => (
        <MuiTableCell
          sx={bodyClassWithBackgroundColor}
          align={'center'}
          key={sourceIdx}
        >
          {props.signalCountsPerSource[sourceName] || componentText.absent}
        </MuiTableCell>
      ))}
      <MuiTableCell sx={bodyClassWithBackgroundColor} align={'center'}>
        {props.totalSignalCount}
      </MuiTableCell>
    </MuiTableRow>
  );

  function renderCriticalityCell() {
    return (
      <MuiTableCell sx={bodyClassWithBackgroundColor} align={'center'}>
        {props.licenseCriticality === undefined ? (
          componentText.absent
        ) : (
          <CriticalityIcon
            criticality={props.licenseCriticality}
            tooltip={
              props.licenseCriticality === Criticality.High
                ? componentText.columns.criticality.high
                : componentText.columns.criticality.medium
            }
          />
        )}
      </MuiTableCell>
    );
  }

  function renderClassificationCell() {
    return (
      <MuiTableCell sx={bodyClassWithBackgroundColor} key={1} align={'center'}>
        <span>
          {props.licenseClassification
            ? (classifications[props.licenseClassification] ??
              componentText.absent)
            : componentText.absent}
        </span>
      </MuiTableCell>
    );
  }
};
