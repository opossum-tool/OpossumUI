// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { closePopup } from '../../state/actions/view-actions/view-actions';
import { ButtonText, ProjectStatisticsPopupTitle } from '../../enums/enums';
import MuiBox from '@mui/material/Box';
import MuiTypography from '@mui/material/Typography';
import {
  getExternalAttributions,
  getExternalAttributionSources,
  getManualAttributions,
} from '../../state/selectors/all-views-resource-selectors';
import {
  aggregateAttributionPropertiesFromAttributions,
  aggregateLicensesAndSourcesFromAttributions,
  getCriticalSignalsCount,
  getIncompleteAttributions,
  getMostFrequentLicenses,
  getUniqueLicenseNameToAttribution,
  sortAttributionPropertiesEntries,
} from './project-statistics-popup-helpers';
import { AttributionCountPerSourcePerLicenseTable } from './AttributionCountPerSourcePerLicenseTable';
import { AttributionPropertyCountTable } from './AttributionPropertyCountTable';
import { CriticalLicensesTable } from './CriticalLicensesTable';
import { AccordionWithPieChart } from './AccordionWithPieChart';
import { Attributions, PackageInfo } from '../../../shared/shared-types';
import { isPackageInfoIncomplete } from '../../util/is-important-attribution-information-missing';
import pickBy from 'lodash/pickBy';

const classes = {
  panels: { display: 'flex' },
  leftPanel: { width: 'fit-content' },
  rightPanel: { flexGrow: 1, marginLeft: '2vw' },
};

export function ProjectStatisticsPopup(): ReactElement {
  const dispatch = useAppDispatch();

  const attributions: Attributions = useAppSelector(getManualAttributions);
  const manualAttributionValues = Object.values(attributions);

  const numberOfAttributions = Object.keys(attributions).length;
  const numberOfIncompleteAttributions = Object.keys(
    pickBy(attributions, (value: PackageInfo) => isPackageInfoIncomplete(value))
  ).length;
  const incompleteAttributionsData = getIncompleteAttributions(
    numberOfAttributions,
    numberOfIncompleteAttributions
  );

  const externalAttributions = useAppSelector(getExternalAttributions);
  const attributionSources = useAppSelector(getExternalAttributionSources);
  const strippedLicenseNameToAttribution =
    getUniqueLicenseNameToAttribution(externalAttributions);

  const { attributionCountPerSourcePerLicense, licenseNamesWithCriticality } =
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

  const mostFrequentLicenseCountData = getMostFrequentLicenses(
    attributionCountPerSourcePerLicense
  );

  const criticalSignalsCountData = getCriticalSignalsCount(
    attributionCountPerSourcePerLicense,
    licenseNamesWithCriticality
  );

  const isThereAnyPieChartData =
    mostFrequentLicenseCountData.length > 0 ||
    criticalSignalsCountData.length > 0;

  function close(): void {
    dispatch(closePopup());
  }

  return (
    <NotificationPopup
      content={
        <>
          <MuiBox style={classes.panels}>
            <MuiBox style={classes.leftPanel}>
              <AttributionPropertyCountTable
                attributionPropertyCountsEntries={
                  sortedManualAttributionPropertyCountsEntries
                }
                title={
                  ProjectStatisticsPopupTitle.AttributionPropertyCountTable
                }
              />
              <CriticalLicensesTable
                attributionCountPerSourcePerLicense={
                  attributionCountPerSourcePerLicense
                }
                licenseNamesWithCriticality={licenseNamesWithCriticality}
                title={ProjectStatisticsPopupTitle.CriticalLicensesTable}
              />
            </MuiBox>
            <MuiBox style={classes.rightPanel}>
              <MuiTypography variant="subtitle1">
                {isThereAnyPieChartData
                  ? ProjectStatisticsPopupTitle.PieChartsSectionHeader
                  : null}
              </MuiTypography>
              <AccordionWithPieChart
                data={mostFrequentLicenseCountData}
                title={
                  ProjectStatisticsPopupTitle.MostFrequentLicenseCountPieChart
                }
              />
              <AccordionWithPieChart
                data={criticalSignalsCountData}
                title={ProjectStatisticsPopupTitle.CriticalSignalsCountPieChart}
              />
              <AccordionWithPieChart
                data={incompleteAttributionsData}
                title={ProjectStatisticsPopupTitle.IncompleteLicensesPieChart}
              />
            </MuiBox>
          </MuiBox>
          <AttributionCountPerSourcePerLicenseTable
            attributionCountPerSourcePerLicense={
              attributionCountPerSourcePerLicense
            }
            licenseNamesWithCriticality={licenseNamesWithCriticality}
            title={
              ProjectStatisticsPopupTitle.AttributionCountPerSourcePerLicenseTable
            }
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
