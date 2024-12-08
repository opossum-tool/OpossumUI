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

import { tableClasses } from '../../shared-styles';

const ATTRIBUTION_PROPERTIES_ID_TO_DISPLAY_NAME: {
  [attributionProperty: string]: string;
} = {
  needsReview: 'Needs review',
  followUp: 'Follow up',
  firstParty: 'First party',
  incomplete: 'Incomplete Attributions',
};

const classes = {
  container: {
    maxHeight: '100px',
    maxWidth: '500px',
    width: '35vw',
    marginBottom: '3px',
  },
};

interface AttributionPropertyCountTableProps {
  attributionPropertyCountsEntries: Array<Array<string | number>>;
  title: string;
}

export const AttributionPropertyCountTable: React.FC<
  AttributionPropertyCountTableProps
> = (props) => {
  const attributionPropertyDisplayNames =
    props.attributionPropertyCountsEntries.map((entry) =>
      _getAttributionPropertyDisplayNameFromId(entry[0].toString()),
    );
  const attributionPropertyCounts = props.attributionPropertyCountsEntries.map(
    (entry) => entry[1].toString(),
  );

  return (
    <MuiBox>
      <MuiTypography variant="subtitle1">{props.title}</MuiTypography>
      <MuiTableContainer sx={classes.container}>
        <MuiTable size="small" stickyHeader>
          <MuiTableHead>
            <MuiTableRow>
              {attributionPropertyDisplayNames.map(
                (attributionPropertyDisplayName, index) => (
                  <MuiTableCell
                    sx={tableClasses.head}
                    key={index}
                    align="center"
                  >
                    {attributionPropertyDisplayName}
                  </MuiTableCell>
                ),
              )}
            </MuiTableRow>
          </MuiTableHead>
          <MuiTableBody>
            <MuiTableRow>
              {attributionPropertyCounts.map(
                (attributionPropertyCount, index) => (
                  <MuiTableCell
                    sx={tableClasses.body}
                    key={index}
                    align="center"
                  >
                    {attributionPropertyCount}
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
  if (attributionProperty in ATTRIBUTION_PROPERTIES_ID_TO_DISPLAY_NAME) {
    return ATTRIBUTION_PROPERTIES_ID_TO_DISPLAY_NAME[attributionProperty];
  }
  return attributionProperty;
}
