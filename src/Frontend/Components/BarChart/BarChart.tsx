// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useTheme } from '@mui/material/styles';
import {
  Bar as RcBar,
  BarChart as RcBarChart,
  Label as RcLabel,
  ResponsiveContainer as RcResponsiveContainer,
  Tooltip as RcTooltip,
  XAxis as RcXAxis,
  YAxis as RcYAxis,
} from 'recharts';

import { text } from '../../../shared/text';
import {
  chartTooltipContentStyle,
  chartTooltipTextStyle,
  OpossumColors,
} from '../../shared-styles';
import type { ChartDataItem } from '../../types/types';

const MARGIN_LEFT_IN_THEME_UNITS = 2;
const MARGIN_RIGHT_IN_THEME_UNITS = 2.5;
const MARGIN_BOTTOM_IN_THEME_UNITS = 1;
const X_AXIS_LABEL_OFFSET_IN_THEME_UNITS = 0.75;

interface BarChartProps {
  data: Array<ChartDataItem>;
}

export const BarChart: React.FC<BarChartProps> = (props) => {
  const theme = useTheme();

  const tickStyle = {
    fontFamily: 'sans-serif',
    fontSize: theme.typography.caption.fontSize,
  } satisfies React.SVGProps<SVGTextElement>;

  const spacingPx = (units: number): number => parseFloat(theme.spacing(units));

  return (
    <RcResponsiveContainer width={'100%'} height={'100%'}>
      <RcBarChart
        layout={'vertical'}
        data={props.data}
        margin={{
          left: spacingPx(MARGIN_LEFT_IN_THEME_UNITS),
          right: spacingPx(MARGIN_RIGHT_IN_THEME_UNITS),
          bottom: spacingPx(MARGIN_BOTTOM_IN_THEME_UNITS),
        }}
      >
        <RcXAxis type={'number'} tick={tickStyle}>
          <RcLabel
            value={text.projectStatisticsPopup.charts.count}
            offset={-spacingPx(X_AXIS_LABEL_OFFSET_IN_THEME_UNITS)}
            position={'insideBottom'}
            style={tickStyle}
          />
        </RcXAxis>
        <RcYAxis dataKey={'name'} type={'category'} tick={tickStyle} />
        <RcTooltip
          contentStyle={chartTooltipContentStyle}
          itemStyle={chartTooltipTextStyle}
          labelStyle={chartTooltipTextStyle}
        />
        <RcBar
          name={text.projectStatisticsPopup.charts.count}
          dataKey={'count'}
          fill={OpossumColors.darkBlue}
          isAnimationActive={false}
        />
      </RcBarChart>
    </RcResponsiveContainer>
  );
};
