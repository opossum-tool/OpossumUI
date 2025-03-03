// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { orderBy } from 'lodash';

import { Criticality } from '../../../shared/shared-types';
import {
  LicenseCounts,
  LicenseNamesWithClassification,
  LicenseNamesWithCriticality,
} from '../../types/types';
import { TableOrdering } from './AttributionCountPerSourcePerLicenseTableHead/AttributionCountPerSourcePerLicenseTableHead';

export function orderLicenseNames(
  licenseNamesWithCriticality: LicenseNamesWithCriticality,
  licenseNamesWithClassification: LicenseNamesWithClassification,
  licenseCounts: LicenseCounts,
  ordering: TableOrdering,
  sourceNames: Array<string>,
): Array<string> {
  return orderBy(
    Object.keys(licenseNamesWithCriticality),
    [
      (licenseName) => {
        const numStartingColumns = 3;

        if (ordering.orderedColumn === 0) {
          return licenseName.toLowerCase();
        } else if (ordering.orderedColumn === 1) {
          switch (licenseNamesWithCriticality[licenseName]) {
            case Criticality.High:
              return 2;
            case Criticality.Medium:
              return 1;
            default:
              return 0;
          }
        } else if (ordering.orderedColumn === 2) {
          return licenseNamesWithClassification[licenseName];
        } else if (
          ordering.orderedColumn <
          numStartingColumns + sourceNames.length
        ) {
          return (
            licenseCounts.attributionCountPerSourcePerLicense[licenseName][
              sourceNames[ordering.orderedColumn - numStartingColumns]
            ] ?? 0
          );
        }

        return licenseCounts.totalAttributionsPerLicense[licenseName];
      },
      (licenseName) => licenseName.toLowerCase(),
    ],
    [ordering.orderDirection, 'asc'],
  );
}
