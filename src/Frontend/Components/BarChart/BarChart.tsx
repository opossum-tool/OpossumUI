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

// Chart plot-area geometry in px, consumed numerically by recharts
const MARGIN_LEFT = 8;
const MARGIN_RIGHT = 10;
const MARGIN_BOTTOM = 4;
const X_AXIS_LABEL_OFFSET = 3;

interface BarChartProps {
  data: Array<ChartDataItem>;
}

export const BarChart: React.FC<BarChartProps> = (props) => {
  const theme = useTheme();

  const tickStyle = {
    fontFamily: 'sans-serif',
    fontSize: theme.typography.caption.fontSize,
  } satisfies React.SVGProps<SVGTextElement>;

  return (
    <RcResponsiveContainer width={'100%'} height={'100%'}>
      <RcBarChart
        layout={'vertical'}
        data={props.data}
        margin={{
          left: MARGIN_LEFT,
          right: MARGIN_RIGHT,
          bottom: MARGIN_BOTTOM,
        }}
      >
        <RcXAxis type={'number'} tick={tickStyle}>
          <RcLabel
            value={text.projectStatisticsPopup.charts.count}
            offset={-X_AXIS_LABEL_OFFSET}
            position={'insideBottom'}
            style={tickStyle}
          />
        </RcXAxis>
        <RcYAxis dataKey={'name'} type={'category'} tick={tickStyle} />
        <RcTooltip
          contentStyle={chartTooltipContentStyle(theme)}
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
