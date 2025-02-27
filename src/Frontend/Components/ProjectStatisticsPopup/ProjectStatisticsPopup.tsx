// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import MuiTypography from '@mui/material/Typography';

import { Criticality } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { criticalityColor, OpossumColors } from '../../shared-styles';
import { closePopup } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  getClassifications,
  getExternalAttributionSources,
  getManualAttributions,
  getUnresolvedExternalAttributions,
} from '../../state/selectors/resource-selectors';
import { useUserSetting } from '../../state/variables/use-user-setting';
import { AccordionWithPieChart } from '../AccordionWithPieChart/AccordionWithPieChart';
import { AttributionCountPerSourcePerLicenseTable } from '../AttributionCountPerSourcePerLicenseTable/AttributionCountPerSourcePerLicenseTable';
import { AttributionPropertyCountTable } from '../AttributionPropertyCountTable/AttributionPropertyCountTable';
import { Checkbox } from '../Checkbox/Checkbox';
import { CriticalLicensesTable } from '../CriticalLicensesTable/CriticalLicensesTable';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import {
  aggregateAttributionPropertiesFromAttributions,
  aggregateLicensesAndSourcesFromAttributions,
  getCriticalSignalsCount,
  getIncompleteAttributionsCount,
  getMostFrequentLicenses,
  getSignalCountByClassification,
  getUniqueLicenseNameToAttribution,
} from './ProjectStatisticsPopup.util';

const classes = {
  panels: { display: 'flex' },
  leftPanel: { width: 'fit-content' },
  rightPanel: { flexGrow: 1, marginLeft: '2vw' },
};

export const ProjectStatisticsPopup: React.FC = () => {
  const dispatch = useAppDispatch();

  const manualAttributions = useAppSelector(getManualAttributions);
  const attributionSources = useAppSelector(getExternalAttributionSources);
  const classifications = useAppSelector(getClassifications);

  const unresolvedExternalAttribution = useAppSelector(
    getUnresolvedExternalAttributions,
  );

  const strippedLicenseNameToAttribution = getUniqueLicenseNameToAttribution(
    unresolvedExternalAttribution,
  );

  const {
    licenseCounts,
    licenseNamesWithCriticality,
    licenseNamesWithClassification,
  } = aggregateLicensesAndSourcesFromAttributions(
    unresolvedExternalAttribution,
    strippedLicenseNameToAttribution,
    attributionSources,
  );

  const mostFrequentLicenseCountData = getMostFrequentLicenses(licenseCounts);

  const criticalSignalsCount = getCriticalSignalsCount(
    licenseCounts,
    licenseNamesWithCriticality,
  );

  const criticalSignalsCountPieChartData = criticalSignalsCount.map(
    ({ criticality, count }) => ({
      name: text.projectStatisticsPopup.charts.criticalSignalsCountPieChart.segmentLabel(
        criticality,
      ),
      count,
    }),
  );

  const criticalSignalsCountColors = {
    [text.projectStatisticsPopup.charts.criticalSignalsCountPieChart.segmentLabel(
      Criticality.High,
    )]: criticalityColor.high,
    [text.projectStatisticsPopup.charts.criticalSignalsCountPieChart.segmentLabel(
      Criticality.Medium,
    )]: criticalityColor.medium,
    [text.projectStatisticsPopup.charts.criticalSignalsCountPieChart.segmentLabel(
      undefined,
    )]: OpossumColors.darkBlue,
  };

  const signalCountByClassification = getSignalCountByClassification(
    licenseCounts,
    licenseNamesWithClassification,
    classifications,
  );

  const manualAttributionPropertyCounts =
    aggregateAttributionPropertiesFromAttributions(manualAttributions);

  const incompleteAttributionsData =
    getIncompleteAttributionsCount(manualAttributions);

  const isThereAnyPieChartData =
    mostFrequentLicenseCountData.length > 0 ||
    criticalSignalsCount.length > 0 ||
    signalCountByClassification.length > 0 ||
    incompleteAttributionsData.length > 0;

  function close(): void {
    dispatch(closePopup());
  }

  const [showProjectStatistics, setShowProjectStatistics, hydrated] =
    useUserSetting({ defaultValue: true, key: 'showProjectStatistics' });

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
                  text.projectStatisticsPopup.charts
                    .attributionPropertyCountTable
                }
              />
              <CriticalLicensesTable
                totalAttributionsPerLicense={
                  licenseCounts.totalAttributionsPerLicense
                }
                licenseNamesWithCriticality={licenseNamesWithCriticality}
                title={text.projectStatisticsPopup.charts.criticalLicensesTable}
              />
            </MuiBox>
            <MuiBox style={classes.rightPanel}>
              <MuiTypography variant="subtitle1">
                {isThereAnyPieChartData
                  ? text.projectStatisticsPopup.charts.pieChartsSectionHeader
                  : null}
              </MuiTypography>
              <AccordionWithPieChart
                data={mostFrequentLicenseCountData}
                title={
                  text.projectStatisticsPopup.charts
                    .mostFrequentLicenseCountPieChart
                }
                defaultExpanded={true}
              />
              <AccordionWithPieChart
                data={criticalSignalsCountPieChartData}
                title={
                  text.projectStatisticsPopup.charts
                    .criticalSignalsCountPieChart.title
                }
                pieChartColorMap={criticalSignalsCountColors}
              />
              <AccordionWithPieChart
                data={signalCountByClassification}
                title={
                  text.projectStatisticsPopup.charts
                    .signalCountByClassificationPieChart
                }
              />
              <AccordionWithPieChart
                data={incompleteAttributionsData}
                title={
                  text.projectStatisticsPopup.charts
                    .incompleteAttributionsPieChart
                }
              />
            </MuiBox>
          </MuiBox>
          <AttributionCountPerSourcePerLicenseTable
            licenseCounts={licenseCounts}
            licenseNamesWithCriticality={licenseNamesWithCriticality}
            title={text.projectStatisticsPopup.charts.licenseCountsTable}
          />
        </>
      }
      header={text.projectStatisticsPopup.title}
      isOpen={true}
      fullWidth={true}
      rightButtonConfig={{
        onClick: close,
        buttonText: text.buttons.close,
      }}
      onBackdropClick={close}
      onEscapeKeyDown={close}
      aria-label={'project statistics'}
      customAction={
        <Checkbox
          checked={showProjectStatistics}
          onChange={(event) => setShowProjectStatistics(event.target.checked)}
          disabled={!hydrated}
          label={text.projectStatisticsPopup.toggleStartupCheckbox}
        />
      }
    />
  );
};
