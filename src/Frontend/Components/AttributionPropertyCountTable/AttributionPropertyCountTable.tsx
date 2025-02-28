// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import MuiTable from '@mui/material/Table';
import MuiTableBody from '@mui/material/TableBody';
import MuiTableCell from '@mui/material/TableCell';
import MuiTableContainer from '@mui/material/TableContainer';
import MuiTableHead from '@mui/material/TableHead';
import MuiTableRow from '@mui/material/TableRow';
import MuiTypography from '@mui/material/Typography';
import { map, sum } from 'lodash';

import { tableClasses } from '../../shared-styles';
import { AttributionStatistics } from '../ProjectStatisticsPopup/ProjectStatisticsPopup.util';

const ATTRIBUTION_PROPERTY_TO_DISPLAY_NAME: {
  [attributionProperty: string]: string;
} = {
  needsReview: 'Needs review',
  followUp: 'Follow up',
  firstParty: 'First party',
  incomplete: 'Incomplete Attributions',
  total: 'Total Attributions',
};

const ATTRIBUTION_PROPERTY_IN_ORDER_OF_COLUMNS = [
  'needsReview',
  'followUp',
  'firstParty',
  'incomplete',
  'total',
];

const classes = {
  container: {
    maxHeight: '100px',
    maxWidth: '500px',
    width: '35vw',
    marginBottom: '3px',
  },
};

interface AttributionPropertyCountTableProps {
  statistics: Array<AttributionStatistics>;
  title: string;
}

export const AttributionPropertyCountTable: React.FC<
  AttributionPropertyCountTableProps
> = (props) => {
  const attributionStats = props.statistics;
  const attributionTableData: Record<string, number> = {
    needsReview: sum(map(attributionStats, 'needsReview')) ?? 0,
    followUp: sum(map(attributionStats, 'followUp')) ?? 0,
    firstParty: sum(map(attributionStats, 'firstParty')) ?? 0,
    incomplete: sum(map(attributionStats, 'isIncomplete')) ?? 0,
    total: attributionStats.length,
  };

  return (
    <MuiBox>
      <MuiTypography variant="subtitle1">{props.title}</MuiTypography>
      <MuiTableContainer sx={classes.container}>
        <MuiTable size="small" stickyHeader>
          <MuiTableHead>
            <MuiTableRow>
              {ATTRIBUTION_PROPERTY_IN_ORDER_OF_COLUMNS.map(
                (propertyName, index) => (
                  <MuiTableCell
                    sx={tableClasses.head}
                    key={index}
                    align="center"
                  >
                    {ATTRIBUTION_PROPERTY_TO_DISPLAY_NAME[propertyName]}
                  </MuiTableCell>
                ),
              )}
            </MuiTableRow>
          </MuiTableHead>
          <MuiTableBody>
            <MuiTableRow>
              {ATTRIBUTION_PROPERTY_IN_ORDER_OF_COLUMNS.map(
                (propertyName, index) => (
                  <MuiTableCell
                    sx={tableClasses.body}
                    key={index}
                    align="center"
                  >
                    {attributionTableData[propertyName]}
                  </MuiTableCell>
                ),
              )}
            </MuiTableRow>
          </MuiTableBody>
        </MuiTable>
      </MuiTableContainer>
    </MuiBox>
  );
};

//exported only for testing
export function _getAttributionPropertyDisplayNameFromId(
  attributionProperty: string,
): string {
  if (attributionProperty in ATTRIBUTION_PROPERTY_TO_DISPLAY_NAME) {
    return ATTRIBUTION_PROPERTY_TO_DISPLAY_NAME[attributionProperty];
  }
  return attributionProperty;
}
