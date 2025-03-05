// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import MuiPaper from '@mui/material/Paper';
import MuiTab from '@mui/material/Tab';
import MuiTabs from '@mui/material/Tabs';
import MuiTypography from '@mui/material/Typography';
import { useState } from 'react';

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
import { BarChart } from '../BarChart/BarChart';
import { Checkbox } from '../Checkbox/Checkbox';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import {
  aggregateAttributionPropertiesFromAttributions,
  aggregateLicensesAndSourcesFromAttributions,
  CRITICALITY_LABEL,
  getCriticalSignalsCount,
  getIncompleteAttributionsCount,
  getMostFrequentLicenses,
  getSignalCountByClassification,
} from './ProjectStatisticsPopup.util';

const classes = {
  panels: { display: 'flex' },
  leftPanel: { width: 'fit-content' },
  rightPanel: { flexGrow: 1, marginLeft: '2vw' },
};

const CRITICALITY_COLORS = {
  [CRITICALITY_LABEL[Criticality.High]]: criticalityColor[Criticality.High],
  [CRITICALITY_LABEL[Criticality.Medium]]: criticalityColor[Criticality.Medium],
  [CRITICALITY_LABEL[Criticality.None]]: criticalityColor[Criticality.None],
};

export const ProjectStatisticsPopup: React.FC = () => {
  const dispatch = useAppDispatch();

  const manualAttributions = useAppSelector(getManualAttributions);
  const attributionSources = useAppSelector(getExternalAttributionSources);
  const classifications = useAppSelector(getClassifications);

  const unresolvedExternalAttribution = useAppSelector(
    getUnresolvedExternalAttributions,
  );

  const {
    licenseCounts,
    licenseNamesWithCriticality,
    licenseNamesWithClassification,
  } = aggregateLicensesAndSourcesFromAttributions(
    unresolvedExternalAttribution,
    attributionSources,
  );

  const mostFrequentLicenseCountData = getMostFrequentLicenses(licenseCounts);

  const criticalSignalsCount = getCriticalSignalsCount(
    licenseCounts,
    licenseNamesWithCriticality,
  );

  const signalCountByClassification = getSignalCountByClassification(
    licenseCounts,
    licenseNamesWithClassification,
    classifications,
  );

  const attributionBarChartData =
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

  const [selectedTab, setSelectedTab] = useState(0);

  return (
    <NotificationPopup
      content={
        <>
          <MuiTabs
            value={selectedTab}
            onChange={(_, tab) => setSelectedTab(tab)}
            sx={{
              marginBottom: '12px',
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            <MuiTab label={text.projectStatisticsPopup.tabs.overview} />
            <MuiTab label={text.projectStatisticsPopup.tabs.details} />
          </MuiTabs>
          <TabPanel tabIndex={0} selectedTab={selectedTab}>
            <MuiBox style={classes.panels}>
              <MuiBox style={classes.leftPanel}>
                <MuiPaper
                  sx={{
                    backgroundColor: OpossumColors.lightestBlue,
                    borderRadius: '10px',
                    padding: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <MuiTypography variant="subtitle1">
                    {
                      text.projectStatisticsPopup.charts.attributionProperties
                        .title
                    }
                  </MuiTypography>
                  <BarChart data={attributionBarChartData} />
                </MuiPaper>
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
                  data={criticalSignalsCount}
                  title={
                    text.projectStatisticsPopup.charts
                      .criticalSignalsCountPieChart.title
                  }
                  pieChartColorMap={CRITICALITY_COLORS}
                />
                <AccordionWithPieChart
                  data={signalCountByClassification}
                  title={
                    text.projectStatisticsPopup.charts
                      .signalCountByClassificationPieChart.title
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
          </TabPanel>
          <TabPanel tabIndex={1} selectedTab={selectedTab}>
            <AttributionCountPerSourcePerLicenseTable
              licenseCounts={licenseCounts}
              licenseNamesWithCriticality={licenseNamesWithCriticality}
              licenseNamesWithClassification={licenseNamesWithClassification}
              title={text.projectStatisticsPopup.charts.licenseCountsTable}
            />
          </TabPanel>
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

interface TabPanelProps extends React.PropsWithChildren {
  tabIndex: number;
  selectedTab: number;
}

const TabPanel: React.FC<TabPanelProps> = (props) => {
  return (
    <div
      style={props.selectedTab !== props.tabIndex ? { display: 'none' } : {}}
    >
      {props.children}
    </div>
  );
};
