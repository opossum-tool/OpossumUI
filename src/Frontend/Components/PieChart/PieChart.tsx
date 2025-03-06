// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  Cell as RcCell,
  Legend as RcLegend,
  Pie as RcPie,
  PieChart as RcPieChart,
  ResponsiveContainer as RcResponsiveContainer,
  Tooltip as RcTooltip,
} from 'recharts';

import {
  chartTooltipContentStyle,
  chartTooltipTextStyle,
  OpossumColors,
} from '../../shared-styles';
import { ChartDataItem } from '../../types/types';

const defaultPieChartColors = [
  OpossumColors.darkBlue,
  'hsl(220, 41%, 60%)',
  'hsl(220, 41%, 78%)',
  'hsl(33, 55%, 81%)',
  'hsl(33, 55%, 65%)',
  OpossumColors.brown,
];

const legendElementStyle: React.CSSProperties = {
  display: 'flex',
  fontFamily: 'sans-serif',
  fontSize: '12px',
};

function getLegendIconStyle(backgroundColor: string): React.CSSProperties {
  return {
    backgroundColor,
    borderRadius: '6px',
    height: '12px',
    width: '12px',
    marginRight: '4px',
  };
}

interface PieChartProps {
  segments: Array<ChartDataItem>;
  colorMap?: { [segmentName: string]: string };
}

export const PieChart: React.FC<PieChartProps> = (props) => {
  const pieChartColors = props.segments.map(
    ({ name }, i) =>
      props.colorMap?.[name] ??
      defaultPieChartColors[i % defaultPieChartColors.length],
  );

  return (
    <RcResponsiveContainer width={'100%'} height={'100%'}>
      <RcPieChart>
        <RcPie
          data={props.segments}
          dataKey="count"
          nameKey="name"
          cx="50%"
          cy="50%"
          minAngle={15}
          outerRadius={70}
          isAnimationActive={false}
          blendStroke={true}
        >
          {pieChartColors.map((record, index) => (
            <RcCell key={`cell-${index}`} fill={record} />
          ))}
        </RcPie>
        <RcTooltip
          contentStyle={chartTooltipContentStyle}
          itemStyle={chartTooltipTextStyle}
        />
        <RcLegend
          content={renderLegend}
          verticalAlign="middle"
          align="right"
          layout="vertical"
          width={250}
        />
      </RcPieChart>
    </RcResponsiveContainer>
  );

  function renderLegend(props: { payload?: Array<{ value: string }> }) {
    return (
      <div>
        {props.payload?.map((entry: { value: string }, index: number) => (
          <div style={legendElementStyle} key={`item-${index}`}>
            <div style={getLegendIconStyle(pieChartColors[index])} />
            <div>{entry.value}</div>
          </div>
        ))}
      </div>
    );
  }
};
