// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import MuiTab from '@mui/material/Tab';
import MuiTabs from '@mui/material/Tabs';
import MuiTypography from '@mui/material/Typography';
import { useState } from 'react';

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
          <MuiBox>
            <TabPanel
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}
              tabIndex={0}
              selectedTab={selectedTab}
            >
              <ChartCard>
                <MuiTypography variant="subtitle1">
                  {
                    text.projectStatisticsPopup.charts.attributionProperties
                      .title
                  }
                </MuiTypography>
                <BarChart data={attributionBarChartData} />
              </ChartCard>
              <ChartCard>
                {mostFrequentLicenseCountData.length > 0 ? (
                  <MuiTypography variant="subtitle1">
                    {
                      text.projectStatisticsPopup.charts
                        .mostFrequentLicenseCountPieChart
                    }
                  </MuiTypography>
                ) : null}
                <PieChart segments={mostFrequentLicenseCountData} />
              </ChartCard>
              <ChartCard>
                {criticalSignalsCount.length > 0 ? (
                  <MuiTypography variant="subtitle1">
                    {
                      text.projectStatisticsPopup.charts
                        .criticalSignalsCountPieChart.title
                    }
                  </MuiTypography>
                ) : null}
                <PieChart
                  segments={criticalSignalsCount}
                  colorMap={CRITICALITY_COLORS}
                />
              </ChartCard>
              <ChartCard>
                {signalCountByClassification.length > 0 ? (
                  <MuiTypography variant="subtitle1">
                    {
                      text.projectStatisticsPopup.charts
                        .signalCountByClassificationPieChart.title
                    }
                  </MuiTypography>
                ) : null}
                <PieChart segments={signalCountByClassification} />
              </ChartCard>
              <ChartCard>
                {incompleteAttributionsData.length > 0 ? (
                  <MuiTypography variant="subtitle1">
                    {
                      text.projectStatisticsPopup.charts
                        .incompleteAttributionsPieChart
                    }
                  </MuiTypography>
                ) : null}
                <PieChart segments={incompleteAttributionsData} />
              </ChartCard>
            </TabPanel>
            <TabPanel tabIndex={1} selectedTab={selectedTab}>
              <AttributionCountPerSourcePerLicenseTable
                licenseCounts={licenseCounts}
                licenseNamesWithCriticality={licenseNamesWithCriticality}
                licenseNamesWithClassification={licenseNamesWithClassification}
                title={text.projectStatisticsPopup.charts.licenseCountsTable}
              />
            </TabPanel>
          </MuiBox>
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
  style?: React.CSSProperties;
}

const TabPanel: React.FC<TabPanelProps> = (props) => {
  return (
    <div
      style={{
        ...props.style,
        ...(props.selectedTab !== props.tabIndex ? { display: 'none' } : {}),
      }}
    >
      {props.children}
    </div>
  );
};
