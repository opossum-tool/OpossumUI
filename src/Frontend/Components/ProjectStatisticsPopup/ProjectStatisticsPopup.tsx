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
  getIncompleteAttributionsCount,
  getMostFrequentLicenses,
  getUniqueLicenseNameToAttribution,
} from './project-statistics-popup-helpers';
import { AttributionCountPerSourcePerLicenseTable } from '../AttributionCountPerSourcePerLicenseTable/AttributionCountPerSourcePerLicenseTable';
import { AttributionPropertyCountTable } from '../AttributionPropertyCountTable/AttributionPropertyCountTable';
import { CriticalLicensesTable } from '../CriticalLicensesTable/CriticalLicensesTable';
import { AccordionWithPieChart } from '../AccordionWithPieChart/AccordionWithPieChart';

const classes = {
  panels: { display: 'flex' },
  leftPanel: { width: 'fit-content' },
  rightPanel: { flexGrow: 1, marginLeft: '2vw' },
};

export function ProjectStatisticsPopup(): ReactElement {
  const dispatch = useAppDispatch();

  const manualAttributions = useAppSelector(getManualAttributions);
  const externalAttributions = useAppSelector(getExternalAttributions);
  const attributionSources = useAppSelector(getExternalAttributionSources);
  const strippedLicenseNameToAttribution =
    getUniqueLicenseNameToAttribution(externalAttributions);

  const { licenseCounts, licenseNamesWithCriticality } =
    aggregateLicensesAndSourcesFromAttributions(
      externalAttributions,
      strippedLicenseNameToAttribution,
      attributionSources
    );

  const manualAttributionPropertyCounts =
    aggregateAttributionPropertiesFromAttributions(manualAttributions);

  const mostFrequentLicenseCountData = getMostFrequentLicenses(licenseCounts);

  const criticalSignalsCountData = getCriticalSignalsCount(
    licenseCounts,
    licenseNamesWithCriticality
  );

  const incompleteAttributionsData =
    getIncompleteAttributionsCount(manualAttributions);

  const isThereAnyPieChartData =
    mostFrequentLicenseCountData.length > 0 ||
    criticalSignalsCountData.length > 0 ||
    incompleteAttributionsData.length > 0;

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
                attributionPropertyCountsEntries={Object.entries(
                  manualAttributionPropertyCounts
                )}
                title={
                  ProjectStatisticsPopupTitle.AttributionPropertyCountTable
                }
              />
              <CriticalLicensesTable
                totalAttributionsPerLicense={
                  licenseCounts.totalAttributionsPerLicense
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
            licenseCounts={licenseCounts}
            licenseNamesWithCriticality={licenseNamesWithCriticality}
            title={ProjectStatisticsPopupTitle.LicenseCountsTable}
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
