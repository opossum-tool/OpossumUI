// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import {
  Cell as RcCell,
  Legend as RcLegend,
  PieChart as RcPieChart,
  Pie as RcPie,
  ResponsiveContainer as RcResponsiveContainer,
  Tooltip as RcTooltip,
} from 'recharts';
import MuiBox from '@mui/material/Box';
import { OpossumColors } from '../../shared-styles';

const defaultPieChartColors = [
  OpossumColors.algaeGreen,
  OpossumColors.pink,
  OpossumColors.dirtyYellow,
  OpossumColors.darkGreen,
  OpossumColors.brightPurple,
  OpossumColors.darkBlue,
];

export interface PieChartData {
  name: string;
  count: number;
}

interface PieChartProps {
  segments: Array<PieChartData>;
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
};

export function PieChart(props: PieChartProps): ReactElement {
  let pieChartColors = props.colors;
  if (pieChartColors === undefined) {
    pieChartColors = defaultPieChartColors;
  }
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
            verticalAlign="middle"
            align="right"
            layout="vertical"
            width={250}
            iconSize={5}
            wrapperStyle={{ fontFamily: 'sans-serif' }}
          />
        </RcPieChart>
      </RcResponsiveContainer>
    </MuiBox>
  );
}
