// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
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
import { ChartDataItem } from '../../types/types';

const tickStyle = {
  fontFamily: 'sans-serif',
  fontSize: '12px',
} satisfies React.SVGProps<SVGTextElement>;

interface BarChartProps {
  data: Array<ChartDataItem>;
}

export const BarChart: React.FC<BarChartProps> = (props) => {
  return (
    <RcResponsiveContainer width={'100%'} height={'100%'}>
      <RcBarChart
        layout={'vertical'}
        data={props.data}
        margin={{ left: 8, right: 10 }}
      >
        <RcXAxis type={'number'} tick={tickStyle}>
          <RcLabel
            value={text.projectStatisticsPopup.charts.count}
            offset={-3}
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
          name={text.projectStatisticsPopup.charts.countTooltipName}
          dataKey={'count'}
          fill={OpossumColors.darkBlue}
          isAnimationActive={false}
        />
      </RcBarChart>
    </RcResponsiveContainer>
  );
};
