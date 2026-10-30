// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiLink from '@mui/material/Link';
import { type Theme, useTheme } from '@mui/material/styles';
import {
  type PieSectorShapeProps,
  Legend as RcLegend,
  Pie as RcPie,
  PieChart as RcPieChart,
  ResponsiveContainer as RcResponsiveContainer,
  Sector as RcSector,
  Tooltip as RcTooltip,
} from 'recharts';

import {
  chartTooltipContentStyle,
  chartTooltipTextStyle,
  OpossumColors,
} from '../../shared-styles';
import type { ChartDataItem } from '../../types/types';

// Chart geometry in px, consumed numerically by recharts
const PIE_RADIUS = 70;
const LEGEND_WIDTH = 250;
const LEGEND_SWATCH_SIZE = '12px';

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
    borderRadius: theme.shape.borderRadiusMedium,
    height: LEGEND_SWATCH_SIZE,
    flexShrink: 0,
    width: LEGEND_SWATCH_SIZE,
    marginRight,
  };
}

interface PieChartProps {
  segments: Array<ChartDataItem>;
  colorMap?: { [segmentName: string]: string };
}

export const PieChart: React.FC<PieChartProps> = (props) => {
  const theme = useTheme();

  const legendTextStyle: React.CSSProperties = {
    fontFamily: 'sans-serif',
    fontSize: theme.typography.caption.fontSize,
    lineHeight: theme.typography.caption.lineHeight,
    textAlign: 'left',
    flex: 1,
    minWidth: 0,
    overflowWrap: 'anywhere',
  };

  const pieChartColors = props.segments.map(
    ({ name, color }, i) =>
      color ??
      props.colorMap?.[name] ??
      defaultPieChartColors[i % defaultPieChartColors.length],
  );

  function renderSector(sectorProps: PieSectorShapeProps) {
    const item = props.segments[sectorProps.index];
    return (
      <RcSector
        {...sectorProps}
        onClick={item?.onActivate}
        cursor={item?.onActivate ? 'pointer' : undefined}
      />
    );
  }

  return (
    <RcResponsiveContainer width={'100%'} height={'100%'}>
      <RcPieChart>
        <RcPie
          data={props.segments.map((item, index) => ({
            ...item,
            fill: pieChartColors[index],
          }))}
          dataKey="count"
          nameKey="name"
          minAngle={15}
          outerRadius={PIE_RADIUS}
          isAnimationActive={false}
          stroke="none"
          shape={renderSector}
        />
        <RcTooltip
          contentStyle={chartTooltipContentStyle(theme)}
          itemStyle={chartTooltipTextStyle}
        />
        <RcLegend
          content={() => (
            <div>
              {props.segments.map((item, index) => (
                <div
                  style={{ display: 'flex', alignItems: 'center' }}
                  key={item.id ?? index}
                >
                  <div
                    style={getLegendIconStyle(
                      theme,
                      pieChartColors[index],
                      theme.spacing(1),
                    )}
                  />
                  {item.onActivate ? (
                    <MuiLink
                      component={'button'}
                      type={'button'}
                      variant={'inherit'}
                      underline={'hover'}
                      onClick={item.onActivate}
                      style={legendTextStyle}
                    >
                      {item.name}
                    </MuiLink>
                  ) : (
                    <div style={legendTextStyle}>{item.name}</div>
                  )}
                </div>
              ))}
            </div>
          )}
          verticalAlign="middle"
          align="right"
          layout="vertical"
          width={LEGEND_WIDTH}
        />
      </RcPieChart>
    </RcResponsiveContainer>
  );
};
