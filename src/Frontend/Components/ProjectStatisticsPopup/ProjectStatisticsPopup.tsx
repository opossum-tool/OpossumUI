// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import MuiTypography from '@mui/material/Typography';
import { ReactElement } from 'react';

import { ButtonText, ProjectStatisticsPopupTitle } from '../../enums/enums';
import { closePopup } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  getExternalAttributions,
  getExternalAttributionSources,
  getExternalAttributionsToHashes,
  getManualAttributions,
} from '../../state/selectors/all-views-resource-selectors';
import { AccordionWithPieChart } from '../AccordionWithPieChart/AccordionWithPieChart';
import { AttributionCountPerSourcePerLicenseTable } from '../AttributionCountPerSourcePerLicenseTable/AttributionCountPerSourcePerLicenseTable';
import { AttributionPropertyCountTable } from '../AttributionPropertyCountTable/AttributionPropertyCountTable';
import { CriticalLicensesTable } from '../CriticalLicensesTable/CriticalLicensesTable';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import {
  aggregateAttributionPropertiesFromAttributions,
  aggregateLicensesAndSourcesFromAttributions,
  getCriticalSignalsCount,
  getIncompleteAttributionsCount,
  getMostFrequentLicenses,
  getUniqueLicenseNameToAttribution,
} from './project-statistics-popup-helpers';

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
  const externalAttributionsToHashes = useAppSelector(
    getExternalAttributionsToHashes,
  );

  const strippedLicenseNameToAttribution = getUniqueLicenseNameToAttribution(
    externalAttributions,
    externalAttributionsToHashes,
  );

  const { licenseCounts, licenseNamesWithCriticality } =
    aggregateLicensesAndSourcesFromAttributions(
      externalAttributions,
      strippedLicenseNameToAttribution,
      attributionSources,
    );

  const mostFrequentLicenseCountData = getMostFrequentLicenses(licenseCounts);

  const criticalSignalsCountData = getCriticalSignalsCount(
    licenseCounts,
    licenseNamesWithCriticality,
  );

  const manualAttributionPropertyCounts =
    aggregateAttributionPropertiesFromAttributions(manualAttributions);

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
                  manualAttributionPropertyCounts,
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
                defaultExpanded={true}
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
