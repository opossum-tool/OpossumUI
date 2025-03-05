// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import {
  Bar as RcBar,
  BarChart as RcBarChart,
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
    <MuiBox sx={{ maxWidth: '500px' }}>
      <RcResponsiveContainer minWidth={300} maxHeight={200} aspect={2}>
        <RcBarChart
          layout={'vertical'}
          data={props.data}
          margin={{ left: 8, right: 10 }}
        >
          <RcXAxis type={'number'} tick={tickStyle} />
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
          />
        </RcBarChart>
      </RcResponsiveContainer>
    </MuiBox>
  );
};
