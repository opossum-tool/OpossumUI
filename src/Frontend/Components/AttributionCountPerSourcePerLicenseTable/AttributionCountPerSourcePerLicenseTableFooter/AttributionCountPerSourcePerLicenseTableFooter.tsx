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

interface AttributionCountPerSourcePerLicenseTableFooterProps {
  sourceNames: Array<string>;
  totalAttributionsPerSource: { [sourceName: string]: number };
}

export const AttributionCountPerSourcePerLicenseTableFooter: React.FC<
  AttributionCountPerSourcePerLicenseTableFooterProps
> = (props) => {
  return (
    <MuiTableFooter>
      <MuiTableRow>
        <MuiTableCell sx={tableClasses.footer} align={'left'}>
          {text.attributionCountPerSourcePerLicenseTable.footerTitle}
        </MuiTableCell>
        <MuiTableCell sx={tableClasses.footer} />
        {props.sourceNames.map((sourceName, sourceIdx) => (
          <MuiTableCell
            sx={tableClasses.footer}
            key={sourceIdx}
            align={'center'}
          >
            {props.totalAttributionsPerSource[sourceName]}
          </MuiTableCell>
        ))}
        <MuiTableCell sx={tableClasses.footer} align={'center'}>
          {sum(Object.values(props.totalAttributionsPerSource))}
        </MuiTableCell>
      </MuiTableRow>
    </MuiTableFooter>
  );
};
