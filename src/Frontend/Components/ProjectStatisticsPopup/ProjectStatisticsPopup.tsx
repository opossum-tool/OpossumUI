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
} from './project-statistics-popup-helpers';
import { AttributionCountPerSourcePerLicenseTable } from './AttributionCountPerSourcePerLicenseTable';
import { AttributionPropertyCountTable } from './AttributionPropertyCountTable';

const attributionCountPerSourcePerLicenseTableTitle = 'Signals per Sources';
const attributionPropertyCountTableTitle =
  'First Party and Follow Up Attributions';

export function ProjectStatisticsPopup(): ReactElement {
  const dispatch = useAppDispatch();

  const externalAttributionValues = Object.values(
    useAppSelector(getExternalAttributions)
  );
  const manualAttributionValues = Object.values(
    useAppSelector(getManualAttributions)
  );
  const attributionSources = useAppSelector(getExternalAttributionSources);

  const [externalAttributionCountPerSourcePerLicense, licenseNames] =
    aggregateLicensesAndSourcesFromAttributions(
      externalAttributionValues,
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
          <AttributionCountPerSourcePerLicenseTable
            attributionCountPerSourcePerLicense={
              externalAttributionCountPerSourcePerLicense
            }
            licenseNames={licenseNames}
            title={attributionCountPerSourcePerLicenseTableTitle}
          />
          <AttributionPropertyCountTable
            attributionPropertyCountsEntries={
              sortedManualAttributionPropertyCountsEntries
            }
            title={attributionPropertyCountTableTitle}
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
