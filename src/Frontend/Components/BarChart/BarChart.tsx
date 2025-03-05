// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import { SxProps } from '@mui/system';
import {
  Bar as RcBar,
  BarChart as RcBarChart,
  ResponsiveContainer as RcResponsiveContainer,
  Tooltip as RcTooltip,
  XAxis as RcXAxis,
  YAxis as RcYAxis,
} from 'recharts';

import { text } from '../../../shared/text';
import { OpossumColors } from '../../shared-styles';
import { ChartDataItem } from '../../types/types';

const rootStyle = {
  maxWidth: '500px',
} satisfies SxProps;

const tooltipContentStyle = {
  fontSize: '12px',
  background: OpossumColors.grey,
  padding: 3,
  border: 0,
  borderRadius: '4px',
} satisfies React.CSSProperties;

const tooltipTextStyle = {
  color: OpossumColors.white,
  fontFamily: 'sans-serif',
} satisfies React.CSSProperties;

const tickStyle = {
  fontFamily: 'sans-serif',
  fontSize: '12px',
} satisfies React.SVGProps<SVGTextElement>;

interface BarChartProps {
  data: Array<ChartDataItem>;
}

export const BarChart: React.FC<BarChartProps> = (props) => {
  return (
    <MuiBox sx={rootStyle}>
      <RcResponsiveContainer minWidth={300} maxHeight={200} aspect={2}>
        <RcBarChart
          layout={'vertical'}
          data={props.data}
          margin={{ left: 8, right: 10 }}
        >
          <RcXAxis type={'number'} tick={tickStyle} />
          <RcYAxis dataKey={'name'} type={'category'} tick={tickStyle} />
          <RcTooltip
            contentStyle={tooltipContentStyle}
            itemStyle={tooltipTextStyle}
            labelStyle={tooltipTextStyle}
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
