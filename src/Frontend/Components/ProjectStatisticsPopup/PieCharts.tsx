// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  PieLabelRenderProps,
} from 'recharts';
import MuiBox from '@mui/material/Box';
import MuiTypography from '@mui/material/Typography';
import { PieChartProps } from './AttributionCountPerSourcePerLicenseTable';
import { getMostFrequentLicenses } from './project-statistics-popup-helpers';
import { OpossumColors } from '../../shared-styles';

const COLORS = [
  OpossumColors.orange,
  OpossumColors.mediumOrange,
  OpossumColors.darkBlue,
  OpossumColors.brown,
  OpossumColors.lightBlue,
  OpossumColors.green,
];

const RADIAN = Math.PI / 180;

function renderCustomizedLabel(props: PieLabelRenderProps): ReactElement {
  const iRadius = Number(props.innerRadius) || 0;
  const oRadius = Number(props.outerRadius) || 0;
  const mAngle = Number(props.midAngle) || 0;
  const chartX = Number(props.cx) || 0;
  const chartY = Number(props.cy) || 0;
  const radius = iRadius + (oRadius - iRadius) * 1.5;
  const x = chartX + radius * Math.cos(-mAngle * RADIAN);
  const y = chartY + radius * Math.sin(-mAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="black"
      textAnchor={x > Number(props.cx) ? 'start' : 'end'}
      dominantBaseline="central"
      fontFamily="Arial"
    >
      {`${props.payload.payload.licenseName} (${props.payload.payload.count})`}
    </text>
  );
}

export function MostFrequentLicensesPieChart(
  props: PieChartProps
): ReactElement | null {
  const sortedMostFrequentLicenses = getMostFrequentLicenses(
    props.attributionCountPerSourcePerLicense
  );
  if (sortedMostFrequentLicenses.length === 0) {
    return null;
  }

  return (
    <MuiBox>
      <MuiTypography variant="subtitle1">{props.title}</MuiTypography>
      <ResponsiveContainer width="100%" maxHeight={300} aspect={1}>
        <PieChart>
          <Pie
            data={sortedMostFrequentLicenses}
            dataKey="count"
            nameKey="licenseName"
            cx="50%"
            cy="50%"
            paddingAngle={1}
            minAngle={5}
            outerRadius="65%"
            isAnimationActive={false}
            label={renderCustomizedLabel}
          >
            {sortedMostFrequentLicenses.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </MuiBox>
  );
}
