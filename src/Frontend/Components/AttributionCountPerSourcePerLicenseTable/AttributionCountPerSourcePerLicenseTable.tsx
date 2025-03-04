// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import MuiTable from '@mui/material/Table';
import MuiTableBody from '@mui/material/TableBody';
import MuiTableContainer from '@mui/material/TableContainer';
import MuiTypography from '@mui/material/Typography';

import {
  LicenseCounts,
  LicenseNamesWithClassification,
  LicenseNamesWithCriticality,
} from '../../types/types';
import { AttributionCountPerSourcePerLicenseTableFooter } from './AttributionCountPerSourcePerLicenseTableFooter/AttributionCountPerSourcePerLicenseTableFooter';
import { AttributionCountPerSourcePerLicenseTableHead } from './AttributionCountPerSourcePerLicenseTableHead/AttributionCountPerSourcePerLicenseTableHead';
import { AttributionCountPerSourcePerLicenseTableRow } from './AttributionCountPerSourcePerLicenseTableRow/AttributionCountPerSourcePerLicenseTableRow';

const classes = {
  container: {
    maxHeight: '400px',
    marginBottom: '3px',
  },
};

interface AttributionCountPerSourcePerLicenseTableProps {
  licenseCounts: LicenseCounts;
  licenseNamesWithCriticality: LicenseNamesWithCriticality;
  licenseNamesWithClassification: LicenseNamesWithClassification;
  title: string;
}

export const AttributionCountPerSourcePerLicenseTable: React.FC<
  AttributionCountPerSourcePerLicenseTableProps
> = (props) => {
  const sourceNames = Object.keys(
    props.licenseCounts.totalAttributionsPerSource,
  );

  return (
    <MuiBox>
      <MuiTypography variant="subtitle1">{props.title}</MuiTypography>
      <MuiTableContainer sx={classes.container}>
        <MuiTable size="small" stickyHeader>
          <AttributionCountPerSourcePerLicenseTableHead
            sourceNames={sourceNames}
          />
          <MuiTableBody>
            {Object.keys(props.licenseNamesWithCriticality)
              .toSorted()
              .map((licenseName, rowIndex) => (
                <AttributionCountPerSourcePerLicenseTableRow
                  sourceNames={sourceNames}
                  signalCountsPerSource={
                    props.licenseCounts.attributionCountPerSourcePerLicense[
                      licenseName
                    ]
                  }
                  licenseName={licenseName}
                  licenseCriticality={
                    props.licenseNamesWithCriticality[licenseName]
                  }
                  licenseClassification={
                    props.licenseNamesWithClassification[licenseName]
                  }
                  totalSignalCount={
                    props.licenseCounts.totalAttributionsPerLicense[licenseName]
                  }
                  key={rowIndex}
                  rowIndex={rowIndex}
                />
              ))}
          </MuiTableBody>
          <AttributionCountPerSourcePerLicenseTableFooter
            sourceNames={sourceNames}
            totalAttributionsPerSource={
              props.licenseCounts.totalAttributionsPerSource
            }
          />
        </MuiTable>
      </MuiTableContainer>
    </MuiBox>
  );
};
