// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { closePopup } from '../../state/actions/view-actions/view-actions';
import { ButtonText, ProjectStatisticsPopupTitles } from '../../enums/enums';
import MuiBox from '@mui/material/Box';
import {
  getExternalAttributions,
  getExternalAttributionSources,
  getManualAttributions,
} from '../../state/selectors/all-views-resource-selectors';
import {
  aggregateAttributionPropertiesFromAttributions,
  aggregateLicensesAndSourcesFromAttributions,
  getMostFrequentLicenses,
  getUniqueLicenseNameToAttribution,
  sortAttributionPropertiesEntries,
} from './project-statistics-popup-helpers';
import { AttributionCountPerSourcePerLicenseTable } from './AttributionCountPerSourcePerLicenseTable';
import { AttributionPropertyCountTable } from './AttributionPropertyCountTable';
import { CustomizedPieChart } from './PieCharts';
import { CriticalLicensesTable } from './CriticalLicensesTable';

const classes = {
  panels: { display: 'flex' },
  leftPanel: { width: 'fit-content' },
  rightPanel: { flexGrow: 1, marginLeft: '2vw' },
};

export function ProjectStatisticsPopup(): ReactElement {
  const dispatch = useAppDispatch();

  const externalAttributions = useAppSelector(getExternalAttributions);
  const manualAttributionValues = Object.values(
    useAppSelector(getManualAttributions)
  );
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
                  ProjectStatisticsPopupTitles.AttributionPropertyCountTable
                }
              />
              <CriticalLicensesTable
                attributionCountPerSourcePerLicense={
                  attributionCountPerSourcePerLicense
                }
                licenseNamesWithCriticality={licenseNamesWithCriticality}
                title={ProjectStatisticsPopupTitles.CriticalLicensesTable}
              />
            </MuiBox>
            <MuiBox style={classes.rightPanel}>
              <CustomizedPieChart
                data={mostFrequentLicenseCountData}
                title={
                  ProjectStatisticsPopupTitles.MostFrequentLicenseCountPieChart
                }
              />
            </MuiBox>
          </MuiBox>
          <AttributionCountPerSourcePerLicenseTable
            attributionCountPerSourcePerLicense={
              attributionCountPerSourcePerLicense
            }
            licenseNamesWithCriticality={licenseNamesWithCriticality}
            title={
              ProjectStatisticsPopupTitles.AttributionCountPerSourcePerLicenseTable
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
