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
  OpossumColors.purple,
  OpossumColors.brown,
  OpossumColors.green,
  OpossumColors.darkBlue,
  OpossumColors.pastelRed,
  OpossumColors.disabledGrey,
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
            paddingAngle={1}
            minAngle={5}
            outerRadius={70}
            isAnimationActive={false}
          >
            {pieChartColors.map((record, index) => (
              <RcCell key={`cell-${index}`} fill={record} />
            ))}
          </RcPie>
          <RcTooltip />
          <RcLegend
            verticalAlign="middle"
            align="right"
            layout="vertical"
            width={250}
          />
        </RcPieChart>
      </RcResponsiveContainer>
    </MuiBox>
  );
}
