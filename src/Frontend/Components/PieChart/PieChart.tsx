// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import {
  Cell as RcCell,
  Legend as RcLegend,
  Pie as RcPie,
  PieChart as RcPieChart,
  ResponsiveContainer as RcResponsiveContainer,
  Tooltip as RcTooltip,
} from 'recharts';

import { OpossumColors } from '../../shared-styles';
import { ChartDataItem } from '../../types/types';

const defaultPieChartColors = [
  OpossumColors.darkBlue,
  'hsl(220, 41%, 60%)',
  'hsl(220, 41%, 78%)',
  'hsl(33, 55%, 81%)',
  'hsl(33, 55%, 65%)',
  OpossumColors.brown,
];

interface PieChartProps {
  segments: Array<ChartDataItem>;
  colors?: Array<string>;
}

const classes = {
  root: {
    maxWidth: '500px',
  },
  tooltipContentStyle: {
    fontSize: '12px',
    background: OpossumColors.grey,
    padding: 3,
    border: 0,
    borderRadius: '4px',
  },
  tooltipItemStyle: {
    color: OpossumColors.white,
    fontFamily: 'sans-serif',
  },
  legendElement: {
    display: 'flex',
    fontFamily: 'sans-serif',
    fontSize: '12px',
  },
  legendIcon: (backgroundColor: string): React.CSSProperties => {
    return {
      backgroundColor,
      borderRadius: '6px',
      height: '12px',
      width: '12px',
      marginRight: '4px',
    };
  },
};

export const PieChart: React.FC<PieChartProps> = (props) => {
  const pieChartColors = props.colors || defaultPieChartColors;

  return (
    <MuiBox sx={classes.root}>
      <RcResponsiveContainer maxHeight={200} aspect={2}>
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
            contentStyle={classes.tooltipContentStyle}
            itemStyle={classes.tooltipItemStyle}
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
    </MuiBox>
  );

  function renderLegend(props: { payload?: Array<{ value: string }> }) {
    return (
      <div>
        {props.payload?.map((entry: { value: string }, index: number) => (
          <div style={classes.legendElement} key={`item-${index}`}>
            <div style={classes.legendIcon(pieChartColors[index])} />
            <div>{entry.value}</div>
          </div>
        ))}
      </div>
    );
  }
};
