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
import { PieChartData } from './project-statistics-popup-helpers';
import { OpossumColors } from '../../shared-styles';
import { ProjectStatisticsPopupTitle } from '../../enums/enums';

interface PieChartProps {
  data: Array<PieChartData>;
  title: string;
}

const defaultPieChartColors = [
  OpossumColors.purple,
  OpossumColors.brown,
  OpossumColors.green,
  OpossumColors.darkBlue,
  OpossumColors.pastelRed,
  OpossumColors.disabledGrey,
];

const criticalColors: { [criticality: string]: string } = {
  High: OpossumColors.orange,
  Medium: OpossumColors.mediumOrange,
  'Not critical': OpossumColors.darkBlue,
};

const classes = {
  root: {
    maxWidth: '500px',
  },
};

export function CustomizedPieChart(props: PieChartProps): ReactElement {
  return (
    <MuiBox sx={classes.root}>
      <ResponsiveContainer maxHeight={200} aspect={2}>
        <PieChart>
          <Pie
            data={props.data}
            dataKey="count"
            nameKey="name"
            cx="50%"
            cy="50%"
            paddingAngle={1}
            minAngle={5}
            outerRadius={70}
          >
            {props.data.map((record, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  props.title ===
                  ProjectStatisticsPopupTitle.CriticalSignalsCountPieChart
                    ? criticalColors[record.name]
                    : defaultPieChartColors[index]
                }
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend
            verticalAlign="middle"
            align="right"
            layout="vertical"
            width={250}
          />
        </PieChart>
      </ResponsiveContainer>
    </MuiBox>
  );
}
