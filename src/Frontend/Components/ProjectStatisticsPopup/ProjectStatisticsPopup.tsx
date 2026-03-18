// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { createTheme, Grid as MuiGrid, useTheme } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import MuiTab from '@mui/material/Tab';
import MuiTabs from '@mui/material/Tabs';
import MuiTypography from '@mui/material/Typography';
import MuiBox from '@mui/system/Box';
import { type PropsWithChildren, useState } from 'react';

import { Criticality } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { criticalityColor, OpossumColors } from '../../shared-styles';
import { closePopup } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { getClassifications } from '../../state/selectors/resource-selectors';
import { useExternalAttributionFilters } from '../../state/variables/use-filters';
import { useUserSettings } from '../../state/variables/use-user-setting';
import { backend } from '../../util/backendClient';
import { AttributionCountPerSourcePerLicenseTable } from '../AttributionCountPerSourcePerLicenseTable/AttributionCountPerSourcePerLicenseTable';
import { BarChart } from '../BarChart/BarChart';
import { Checkbox } from '../Checkbox/Checkbox';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { PieChart } from '../PieChart/PieChart';
import { ChartCard } from './ProjectStatisticsPopup.style';
import {
  CRITICALITY_LABEL,
  transformName,
} from './ProjectStatisticsPopup.util';

const CRITICALITY_COLORS = {
  [CRITICALITY_LABEL[Criticality.High]]: criticalityColor[Criticality.High],
  [CRITICALITY_LABEL[Criticality.Medium]]: criticalityColor[Criticality.Medium],
  [CRITICALITY_LABEL[Criticality.None]]: criticalityColor[Criticality.None],
};

export const ProjectStatisticsPopup: React.FC = () => {
  const dispatch = useAppDispatch();

  const classifications = useAppSelector(getClassifications);

  const manualAttributionStatistics =
    backend.manualAttributionStatistics.useQuery();
  const externalAttributionStatistics =
    backend.externalAttributionStatistics.useQuery();

  const [_, setFilteredAttributions] = useExternalAttributionFilters();

  const statistics =
    manualAttributionStatistics.data && externalAttributionStatistics.data
      ? {
          ...manualAttributionStatistics.data,
          ...externalAttributionStatistics.data,
        }
      : undefined;

  const licenseTable = backend.licenseTable.useQuery();

  function close(): void {
    dispatch(closePopup());
  }

  function handleLicenseClick(licenseName: string): void {
    setFilteredAttributions((prev) => ({
      ...prev,
      selectedLicense: licenseName,
    }));
    close();
  }

  const [userSettings, updateUserSettings] = useUserSettings();

  const showProjectStatistics = userSettings.showProjectStatistics;
  const showClassifications = userSettings.showClassifications;
  const showCriticality = userSettings.showCriticality;

  const [selectedTab, setSelectedTab] = useState(0);

  if (!statistics || !licenseTable.data) {
    return null;
  }

  return (
    <NotificationPopup
      header={text.projectStatisticsPopup.title}
      isOpen={true}
      width={'min(95vw, max(550px, 85vw))'}
      height={'min(95vh, max(550px, 75vh))'}
      rightButtonConfig={{ onClick: close, buttonText: text.buttons.close }}
      onBackdropClick={close}
      onEscapeKeyDown={close}
      aria-label={'project statistics'}
      customAction={
        <Checkbox
          checked={showProjectStatistics}
          onChange={(event) =>
            updateUserSettings({ showProjectStatistics: event.target.checked })
          }
          label={text.projectStatisticsPopup.toggleStartupCheckbox}
        />
      }
    >
      <MuiBox sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <MuiTabs
          value={selectedTab}
          onChange={(_, tab) => setSelectedTab(tab)}
          sx={{ marginBottom: '12px', borderBottom: 1, borderColor: 'divider' }}
        >
          <MuiTab label={text.projectStatisticsPopup.tabs.overview} />
          <MuiTab label={text.projectStatisticsPopup.tabs.details} />
        </MuiTabs>
        <TabPanel tabIndex={0} selectedTab={selectedTab}>
          <ChartGrid>
            <ChartGridItem testId={'attributionBarChart'}>
              <MuiTypography variant="subtitle1">
                {text.projectStatisticsPopup.charts.attributionProperties.title}
              </MuiTypography>
              <BarChart
                data={transformName(
                  statistics.attributionsOverview,
                  (key) =>
                    text.projectStatisticsPopup.charts.attributionProperties[
                      key
                    ],
                )}
              />
            </ChartGridItem>
            <ChartGridItem
              shouldRender={statistics.mostFrequentLicenses.some(
                (l) => l.count > 0,
              )}
              testId={'mostFrequentLicenseCountPieChart'}
            >
              <MuiTypography variant="subtitle1">
                {
                  text.projectStatisticsPopup.charts
                    .mostFrequentLicenseCountPieChart
                }
              </MuiTypography>
              <PieChart segments={statistics.mostFrequentLicenses} />
            </ChartGridItem>
            <ChartGridItem
              shouldRender={
                statistics.signalsByCriticality.some((s) => s.count > 0) &&
                showCriticality
              }
              testId={'criticalSignalsCountPieChart'}
            >
              <MuiTypography variant="subtitle1">
                {
                  text.projectStatisticsPopup.charts
                    .criticalSignalsCountPieChart.title
                }
              </MuiTypography>
              <PieChart
                segments={transformName(statistics.signalsByCriticality, (k) =>
                  k === null
                    ? text.projectStatisticsPopup.charts.noLicense
                    : CRITICALITY_LABEL[k as Criticality],
                )}
                colorMap={{
                  ...CRITICALITY_COLORS,
                  [text.projectStatisticsPopup.charts.noLicense]:
                    OpossumColors.lightGrey,
                }}
              />
            </ChartGridItem>
            <ChartGridItem
              shouldRender={
                statistics.signalsByClassification.some((s) => s.count > 0) &&
                showClassifications
              }
              testId={'signalCountByClassificationPieChart'}
            >
              <MuiTypography variant="subtitle1">
                {
                  text.projectStatisticsPopup.charts
                    .signalCountByClassificationPieChart.title
                }
              </MuiTypography>
              <PieChart
                segments={transformName(
                  statistics.signalsByClassification,
                  (s) =>
                    s === null
                      ? text.projectStatisticsPopup.charts.noLicense
                      : classifications[s].description,
                )}
                colorMap={{
                  ...Object.fromEntries(
                    Object.values(classifications).map((c) => [
                      c.description,
                      c.color,
                    ]),
                  ),
                  [text.projectStatisticsPopup.charts.noLicense]:
                    OpossumColors.lightGrey,
                }}
              />
            </ChartGridItem>
            <ChartGridItem
              shouldRender={statistics.incompleteAttributions.some(
                (a) => a.count > 0,
              )}
              testId={'incompleteAttributionsPieChart'}
            >
              <MuiTypography variant="subtitle1">
                {
                  text.projectStatisticsPopup.charts
                    .incompleteAttributionsPieChart.title
                }
              </MuiTypography>
              <PieChart
                segments={transformName(
                  statistics.incompleteAttributions,
                  (k) =>
                    k === 'incomplete'
                      ? text.projectStatisticsPopup.charts
                          .incompleteAttributionsPieChart.incompleteAttributions
                      : text.projectStatisticsPopup.charts
                          .incompleteAttributionsPieChart.completeAttributions,
                )}
              />
            </ChartGridItem>
          </ChartGrid>
        </TabPanel>
        <TabPanel tabIndex={1} selectedTab={selectedTab}>
          <AttributionCountPerSourcePerLicenseTable
            tableData={licenseTable.data}
            setSelectedLicense={handleLicenseClick}
          />
        </TabPanel>
      </MuiBox>
    </NotificationPopup>
  );
};

interface TabPanelProps extends React.PropsWithChildren {
  tabIndex: number;
  selectedTab: number;
}

const TabPanel: React.FC<TabPanelProps> = (props) => {
  const isSelected = props.selectedTab === props.tabIndex;
  if (!isSelected) {
    return null;
  }
  return (
    <MuiBox sx={{ flexGrow: 1, overflowY: 'auto' }}>{props.children}</MuiBox>
  );
};

const ChartGrid: React.FC<PropsWithChildren> = (props) => {
  return (
    <ThemeProvider
      theme={createTheme({
        ...useTheme(),
        breakpoints: { values: { xs: 0, sm: 0, md: 1200, lg: 1725, xl: 2000 } },
      })}
    >
      <MuiGrid
        height={'100%'}
        minHeight={'fit-content'}
        container
        columns={{ sm: 1, md: 2, lg: 3 }}
        spacing={3}
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
  shouldRender?: boolean;
  testId?: string;
}

const ChartGridItem: React.FC<ChartGridItemProps> = (props) => {
  return (props.shouldRender ?? true) ? (
    <MuiGrid
      size={1}
      minHeight={'220px'}
      minWidth={'440px'}
      height={'47%'}
      display={'flex'}
      data-testid={props.testId}
    >
      <ChartCard>{props.children}</ChartCard>
    </MuiGrid>
  ) : null;
};
