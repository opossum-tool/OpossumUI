// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { closePopup } from '../../state/actions/view-actions/view-actions';
import { ButtonText } from '../../enums/enums';
import {
  getExternalAttributions,
  getExternalAttributionSources,
  getManualAttributions,
} from '../../state/selectors/all-views-resource-selectors';
import {
  aggregateLicensesAndSourcesFromAttributions,
  aggregateAttributionPropertiesFromAttributions,
  sortAttributionPropertiesEntries,
  getUniqueLicenseNameToAttribution,
} from './project-statistics-popup-helpers';
import { AttributionCountPerSourcePerLicenseTable } from './AttributionCountPerSourcePerLicenseTable';
import { AttributionPropertyCountTable } from './AttributionPropertyCountTable';
import { CriticalLicensesTable } from './CriticalLicensesTable';

const attributionCountPerSourcePerLicenseTableTitle = 'Signals per Sources';
const attributionPropertyCountTableTitle =
  'First Party and Follow Up Attributions';
const criticalLicensesTableTitle = 'Critical Licenses';

export function ProjectStatisticsPopup(): ReactElement {
  const dispatch = useAppDispatch();

  const externalAttributions = useAppSelector(getExternalAttributions);
  const manualAttributionValues = Object.values(
    useAppSelector(getManualAttributions)
  );
  const attributionSources = useAppSelector(getExternalAttributionSources);
  const strippedLicenseNameToAttribution =
    getUniqueLicenseNameToAttribution(externalAttributions);

  const { attributionCountPerSourcePerLicense, licenseNamesWithCriticalities } =
    aggregateLicensesAndSourcesFromAttributions(
      externalAttributions,
      strippedLicenseNameToAttribution,
      attributionSources
    );

  const manualAttributionPropertyCounts =
    aggregateAttributionPropertiesFromAttributions(manualAttributionValues);
  const sortedManualAttributionPropertyCountsEntries =
    sortAttributionPropertiesEntries(
      Object.entries(manualAttributionPropertyCounts)
    );

  function close(): void {
    dispatch(closePopup());
  }

  return (
    <NotificationPopup
      content={
        <>
          <AttributionPropertyCountTable
            attributionPropertyCountsEntries={
              sortedManualAttributionPropertyCountsEntries
            }
            title={attributionPropertyCountTableTitle}
          />
          <CriticalLicensesTable
            attributionCountPerSourcePerLicense={
              attributionCountPerSourcePerLicense
            }
            licenseNamesWithCriticality={licenseNamesWithCriticalities}
            title={criticalLicensesTableTitle}
          />
          <AttributionCountPerSourcePerLicenseTable
            attributionCountPerSourcePerLicense={
              attributionCountPerSourcePerLicense
            }
            licenseNamesWithCriticality={licenseNamesWithCriticalities}
            title={attributionCountPerSourcePerLicenseTableTitle}
          />
        </>
      }
      header={'Project Statistics'}
      isOpen={true}
      fullWidth={true}
      rightButtonConfig={{
        onClick: close,
        buttonText: ButtonText.Close,
      }}
      onBackdropClick={close}
      onEscapeKeyDown={close}
    />
  );
}
