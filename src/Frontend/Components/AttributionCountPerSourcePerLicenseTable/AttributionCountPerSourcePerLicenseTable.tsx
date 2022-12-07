// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { ProjectLicensesTable } from '../ProjectLicensesTable/ProjectLicensesTable';
import {
  AttributionCountPerSourcePerLicense,
  LicenseNamesWithCriticality,
} from '../../types/types';
import { SOURCE_TOTAL, LICENSE_TOTAL } from '../../shared-constants';

const classes = {
  container: {
    maxHeight: '400px',
    marginBottom: '3px',
  },
};

const LICENSE_COLUMN_NAME_IN_TABLE = 'License name';
const FOOTER_TITLE = 'Total';

interface AttributionCountPerSourcePerLicenseTableProps {
  attributionCountPerSourcePerLicense: AttributionCountPerSourcePerLicense;
  licenseNamesWithCriticality: LicenseNamesWithCriticality;
  title: string;
}

export function AttributionCountPerSourcePerLicenseTable(
  props: AttributionCountPerSourcePerLicenseTableProps
): ReactElement {
  const sourceNamesOrTotal = Object.keys(
    props.attributionCountPerSourcePerLicense[LICENSE_TOTAL]
  );
  sourceNamesOrTotal.splice(sourceNamesOrTotal.indexOf(SOURCE_TOTAL), 1);
  sourceNamesOrTotal.push(SOURCE_TOTAL);
  const sourceNamesRow = [LICENSE_COLUMN_NAME_IN_TABLE].concat(
    sourceNamesOrTotal
  );

  const valuesSourceTotals: Array<string> = sourceNamesOrTotal.map(
    (sourceName) =>
      props.attributionCountPerSourcePerLicense[LICENSE_TOTAL][
        sourceName
      ].toString()
  );

  return (
    <ProjectLicensesTable
      title={props.title}
      containerStyle={classes.container}
      columnHeaders={sourceNamesRow.map(
        (sourceName) => sourceName.charAt(0).toUpperCase() + sourceName.slice(1)
      )}
      columnNames={sourceNamesRow}
      rowNames={Object.keys(props.licenseNamesWithCriticality).sort()}
      tableContent={props.attributionCountPerSourcePerLicense}
      tableFooter={[FOOTER_TITLE].concat(valuesSourceTotals)}
      licenseNamesWithCriticality={props.licenseNamesWithCriticality}
    />
  );
}
