// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import MuiTypography from '@mui/material/Typography';
import { countBy } from 'lodash';

import { Criticality } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { PieChartCriticalityNames } from '../../enums/enums';
import { OpossumColors } from '../../shared-styles';
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
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import {
  aggregateLicensesAndSourcesFromAttributions,
  convertToPieChartData,
  getMostFrequentLicenses,
  prepareStatistics,
} from './ProjectStatisticsPopup.util';

const classes = {
  panels: { display: 'flex' },
  leftPanel: { width: 'fit-content' },
  rightPanel: { flexGrow: 1, marginLeft: '2vw' },
};

const MAX_DISPLAYED_FREQUENT_LICENSES = 5;

function mapCriticalityToText(criticality?: Criticality) {
  if (criticality === Criticality.High) {
    return PieChartCriticalityNames.HighCriticality;
  } else if (criticality === Criticality.Medium) {
    return PieChartCriticalityNames.MediumCriticality;
  }
  return PieChartCriticalityNames.NoCriticality;
}

export const ProjectStatisticsPopup: React.FC = () => {
  const dispatch = useAppDispatch();

  const manualAttributions = useAppSelector(getManualAttributions);
  const attributionSources = useAppSelector(getExternalAttributionSources);
  const classifications = useAppSelector(getClassifications);
  const unresolvedExternalAttribution = useAppSelector(
    getUnresolvedExternalAttributions,
  );

  const externalAttributionStats = prepareStatistics(
    unresolvedExternalAttribution,
    attributionSources,
  );
  const mostFrequentLicenseCountData = getMostFrequentLicenses(
    externalAttributionStats,
    MAX_DISPLAYED_FREQUENT_LICENSES,
  );
  const criticalSignalsCountData = convertToPieChartData(
    countBy(externalAttributionStats, ({ criticality }) =>
      mapCriticalityToText(criticality),
    ),
  );
  const signalCountByClassification = convertToPieChartData(
    countBy(
      externalAttributionStats,
      ({ classification }) =>
        classifications[classification] ?? 'No Classification',
    ),
  );

  const manualAttributionStats = prepareStatistics(manualAttributions);
  const incompleteAttributionsData = convertToPieChartData(
    countBy(manualAttributionStats, ({ isIncomplete }) =>
      isIncomplete ? 'Incomplete attributions' : 'Complete attributions',
    ),
  );

  //const signalsPerSourcesTableData = groupBy(externalAttributionStats, ({ licenseName, criticality, classification }) => {return {licenseName:licenseName, criticality:criticality, classification:classification}})

  const {
    licenseCounts,
    licenseNamesWithCriticality,
    licenseNamesWithClassification,
  } = aggregateLicensesAndSourcesFromAttributions(
    unresolvedExternalAttribution,
    attributionSources,
  );

  const criticalSignalsCountColors = {
    [PieChartCriticalityNames.HighCriticality]: OpossumColors.orange,
    [PieChartCriticalityNames.MediumCriticality]: OpossumColors.mediumOrange,
    [PieChartCriticalityNames.NoCriticality]: OpossumColors.darkBlue,
  };

  const isThereAnyPieChartData =
    mostFrequentLicenseCountData.length > 0 ||
    criticalSignalsCountData.length > 0 ||
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
                statistics={manualAttributionStats}
                title={
                  text.projectStatisticsPopup.charts
                    .attributionPropertyCountTable
                }
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
                data={criticalSignalsCountData}
                title={
                  text.projectStatisticsPopup.charts
                    .criticalSignalsCountPieChart
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
            licenseNamesWithClassification={licenseNamesWithClassification}
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
