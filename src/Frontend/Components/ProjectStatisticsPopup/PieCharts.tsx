// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import {
  Cell,
  Legend,
  PieChart,
  Pie,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import MuiBox from '@mui/material/Box';
import MuiTypography from '@mui/material/Typography';
import { PieChartData } from './project-statistics-popup-helpers';
import { OpossumColors } from '../../shared-styles';

interface PieChartProps {
  data: Array<PieChartData>;
  title: string;
}

const COLORS = [
  OpossumColors.orange,
  OpossumColors.mediumOrange,
  OpossumColors.darkBlue,
  OpossumColors.brown,
  OpossumColors.green,
  OpossumColors.lightBlue,
];

export function CustomizedPieChart(props: PieChartProps): ReactElement | null {
  if (props.data.length === 0) {
    return null;
  }

  return (
    <MuiBox>
      <MuiTypography variant="subtitle1">{props.title}</MuiTypography>
      <ResponsiveContainer width="70%" maxHeight={200} aspect={2}>
        <PieChart>
          <Pie
            data={props.data}
            dataKey="count"
            nameKey="name"
            cx="50%"
            cy="50%"
            paddingAngle={1}
            minAngle={5}
            outerRadius="70"
            isAnimationActive={true}
          >
            {props.data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend verticalAlign="middle" align="right" layout="vertical" />
        </PieChart>
      </ResponsiveContainer>
    </MuiBox>
  );
}
