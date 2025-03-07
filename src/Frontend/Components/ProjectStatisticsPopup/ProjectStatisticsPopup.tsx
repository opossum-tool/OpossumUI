// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { createTheme, Grid2 as MuiGrid, useTheme } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import MuiTab from '@mui/material/Tab';
import MuiTabs from '@mui/material/Tabs';
import MuiTypography from '@mui/material/Typography';
import MuiBox from '@mui/system/Box';
import { PropsWithChildren, useState } from 'react';

import { Criticality } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { criticalityColor } from '../../shared-styles';
import { closePopup } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  getClassifications,
  getExternalAttributionSources,
  getManualAttributions,
  getUnresolvedExternalAttributions,
} from '../../state/selectors/resource-selectors';
import { useUserSetting } from '../../state/variables/use-user-setting';
import { AttributionCountPerSourcePerLicenseTable } from '../AttributionCountPerSourcePerLicenseTable/AttributionCountPerSourcePerLicenseTable';
import { BarChart } from '../BarChart/BarChart';
import { Checkbox } from '../Checkbox/Checkbox';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { PieChart } from '../PieChart/PieChart';
import { ChartCard } from './ProjectStatisticsPopup.style';
import {
  aggregateAttributionPropertiesFromAttributions,
  aggregateLicensesAndSourcesFromAttributions,
  CRITICALITY_LABEL,
  getCriticalSignalsCount,
  getIncompleteAttributionsCount,
  getMostFrequentLicenses,
  getSignalCountByClassification,
} from './ProjectStatisticsPopup.util';

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

  function close(): void {
    dispatch(closePopup());
  }

  const [showProjectStatistics, setShowProjectStatistics, hydrated] =
    useUserSetting({ defaultValue: true, key: 'showProjectStatistics' });

  const [selectedTab, setSelectedTab] = useState(0);

  return (
    <NotificationPopup
      content={
        <MuiBox
          sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}
        >
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
            <ChartGrid>
              <ChartGridItem>
                <MuiTypography variant="subtitle1">
                  {
                    text.projectStatisticsPopup.charts.attributionProperties
                      .title
                  }
                </MuiTypography>
                <BarChart data={attributionBarChartData} />
              </ChartGridItem>
              <ChartGridItem
                isHidden={mostFrequentLicenseCountData.length === 0}
              >
                <MuiTypography variant="subtitle1">
                  {
                    text.projectStatisticsPopup.charts
                      .mostFrequentLicenseCountPieChart
                  }
                </MuiTypography>
                <PieChart segments={mostFrequentLicenseCountData} />
              </ChartGridItem>
              <ChartGridItem isHidden={criticalSignalsCount.length === 0}>
                <MuiTypography variant="subtitle1">
                  {
                    text.projectStatisticsPopup.charts
                      .criticalSignalsCountPieChart.title
                  }
                </MuiTypography>
                <PieChart
                  segments={criticalSignalsCount}
                  colorMap={CRITICALITY_COLORS}
                />
              </ChartGridItem>
              <ChartGridItem
                isHidden={signalCountByClassification.length === 0}
              >
                <MuiTypography variant="subtitle1">
                  {
                    text.projectStatisticsPopup.charts
                      .signalCountByClassificationPieChart.title
                  }
                </MuiTypography>
                <PieChart segments={signalCountByClassification} />
              </ChartGridItem>
              <ChartGridItem isHidden={incompleteAttributionsData.length === 0}>
                <MuiTypography variant="subtitle1">
                  {
                    text.projectStatisticsPopup.charts
                      .incompleteAttributionsPieChart.title
                  }
                </MuiTypography>
                <PieChart segments={incompleteAttributionsData} />
              </ChartGridItem>
            </ChartGrid>
          </TabPanel>
          <TabPanel tabIndex={1} selectedTab={selectedTab}>
            <AttributionCountPerSourcePerLicenseTable
              licenseCounts={licenseCounts}
              licenseNamesWithCriticality={licenseNamesWithCriticality}
              licenseNamesWithClassification={licenseNamesWithClassification}
            />
          </TabPanel>
        </MuiBox>
      }
      header={text.projectStatisticsPopup.title}
      isOpen={true}
      width={'75vw'}
      height={'75vh'}
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
    <MuiBox
      sx={{
        ...(props.selectedTab !== props.tabIndex ? { display: 'none' } : {}),
        flexGrow: 1,
        overflowY: 'auto',
      }}
    >
      {props.children}
    </MuiBox>
  );
};

const ChartGrid: React.FC<PropsWithChildren> = (props) => {
  return (
    <ThemeProvider
      theme={createTheme({
        ...useTheme(),
        breakpoints: {
          values: {
            xs: 0,
            sm: 0,
            md: 1300,
            lg: 1850,
            xl: 2000,
          },
        },
      })}
    >
      <MuiGrid
        height={'100%'}
        minHeight={'fit-content'}
        container
        columns={{ sm: 1, md: 2, lg: 3 }}
        spacing={{ sm: 3, lg: 3 }}
        padding={'12px'}
        paddingTop={'0px'}
        alignContent={'flex-start'}
      >
        {props.children}
      </MuiGrid>
    </ThemeProvider>
  );
};

interface ChartGridItemProps extends PropsWithChildren {
  isHidden?: boolean;
}

const ChartGridItem: React.FC<ChartGridItemProps> = (props) => {
  return props.isHidden ? null : (
    <MuiGrid size={1} minHeight={'220px'} height={'48%'} display={'flex'}>
      <ChartCard>{props.children}</ChartCard>
    </MuiGrid>
  );
};
