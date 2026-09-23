// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { type Theme, useTheme } from '@mui/material/styles';
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
import type { ChartDataItem } from '../../types/types';

const LEGEND_SWATCH_RADIUS_IN_THEME_UNITS = 1.5;
const LEGEND_SWATCH_SIZE_IN_THEME_UNITS = 3;
const PIE_RADIUS_IN_THEME_UNITS = 17.5;
const LEGEND_WIDTH_IN_THEME_UNITS = 62.5;

const defaultPieChartColors = [
  OpossumColors.darkBlue,
  'hsl(220, 41%, 60%)',
  'hsl(220, 41%, 78%)',
  'hsl(33, 55%, 81%)',
  'hsl(33, 55%, 65%)',
  OpossumColors.brown,
];

function getLegendIconStyle(
  theme: Theme,
  backgroundColor: string,
  marginRight: React.CSSProperties['marginRight'],
): React.CSSProperties {
  return {
    backgroundColor,
    borderRadius: theme.spacing(LEGEND_SWATCH_RADIUS_IN_THEME_UNITS),
    height: theme.spacing(LEGEND_SWATCH_SIZE_IN_THEME_UNITS),
    width: theme.spacing(LEGEND_SWATCH_SIZE_IN_THEME_UNITS),
    marginRight,
  };
}

interface PieChartProps {
  segments: Array<ChartDataItem>;
  colorMap?: { [segmentName: string]: string };
}

export const PieChart: React.FC<PieChartProps> = (props) => {
  const theme = useTheme();

  const spacingPx = (units: number): number => parseFloat(theme.spacing(units));

  const legendTextStyle: React.CSSProperties = {
    fontFamily: 'sans-serif',
    fontSize: theme.typography.caption.fontSize,
    width: '95%',
  };

  const pieChartColors = props.segments.map(
    ({ name }, i) =>
      props.colorMap?.[name] ??
      defaultPieChartColors[i % defaultPieChartColors.length],
  );

  const nameToIndex = Object.fromEntries(
    props.segments.map((prop, index) => [prop.name, index]),
  );

  return (
    <RcResponsiveContainer width={'100%'} height={'100%'}>
      <RcPieChart>
        <RcPie
          data={props.segments}
          dataKey="count"
          nameKey="name"
          minAngle={15}
          outerRadius={spacingPx(PIE_RADIUS_IN_THEME_UNITS)}
          isAnimationActive={false}
          stroke="none"
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
          content={({ payload }) => (
            <div>
              {payload
                ?.toSorted(
                  (a, b) =>
                    (a.value &&
                      b.value &&
                      nameToIndex[a.value] - nameToIndex[b.value]) ||
                    0,
                )
                .map((entry, index) => (
                  <div style={{ display: 'flex' }} key={`item-${index}`}>
                    <div
                      style={getLegendIconStyle(
                        theme,
                        entry.color ?? '',
                        theme.spacing(1),
                      )}
                    />
                    <div style={legendTextStyle}>{entry.value}</div>
                  </div>
                ))}
            </div>
          )}
          verticalAlign="middle"
          align="right"
          layout="vertical"
          width={spacingPx(LEGEND_WIDTH_IN_THEME_UNITS)}
        />
      </RcPieChart>
    </RcResponsiveContainer>
  );
};
