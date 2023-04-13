// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { ProjectLicensesTable } from '../ProjectLicensesTable/ProjectLicensesTable';
import { LicenseCounts, LicenseNamesWithCriticality } from '../../types/types';

const classes = {
  container: {
    maxHeight: '400px',
    marginBottom: '3px',
  },
};

const LICENSE_COLUMN_NAME_IN_TABLE = 'License name';
const FOOTER_TITLE = 'Total';
const TOTAL_SOURCES_TITLE = 'Total';

interface AttributionCountPerSourcePerLicenseTableProps {
  licenseCounts: LicenseCounts;
  licenseNamesWithCriticality: LicenseNamesWithCriticality;
  title: string;
}

export function AttributionCountPerSourcePerLicenseTable(
  props: AttributionCountPerSourcePerLicenseTableProps
): ReactElement {
  const sourceNames = Object.keys(
    props.licenseCounts.totalAttributionsPerSource
  );

  const totalNumberOfAttributionsPerSource = sourceNames.map((sourceName) =>
    props.licenseCounts.totalAttributionsPerSource[sourceName].toString()
  );
  const totalNumberOfAttributions = Object.values(
    props.licenseCounts.totalAttributionsPerSource
  )
    .reduce((partialSum, num) => partialSum + num, 0)
    .toString();

  const footerRow = [FOOTER_TITLE]
    .concat(totalNumberOfAttributionsPerSource)
    .concat(totalNumberOfAttributions);
  const headerRow = [LICENSE_COLUMN_NAME_IN_TABLE]
    .concat(sourceNames)
    .concat(TOTAL_SOURCES_TITLE)
    .map(
      (sourceName) => sourceName.charAt(0).toUpperCase() + sourceName.slice(1)
    );

  Object.entries(
    props.licenseCounts.attributionCountPerSourcePerLicense
  ).forEach(
    ([licenseName, value]) =>
      (value[TOTAL_SOURCES_TITLE] =
        props.licenseCounts.totalAttributionsPerLicense[licenseName])
  );

  return (
    <ProjectLicensesTable
      title={props.title}
      containerStyle={classes.container}
      columnHeaders={headerRow}
      columnNames={headerRow}
      rowNames={Object.keys(props.licenseNamesWithCriticality).sort()}
      tableContent={props.licenseCounts.attributionCountPerSourcePerLicense}
      tableFooter={footerRow}
      licenseNamesWithCriticality={props.licenseNamesWithCriticality}
    />
  );
}
