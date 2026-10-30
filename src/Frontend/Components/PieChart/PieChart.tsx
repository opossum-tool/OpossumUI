// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiLink from '@mui/material/Link';
import { type Theme, useTheme } from '@mui/material/styles';
import { useState } from 'react';
import {
  DefaultZIndexes,
  type PieSectorShapeProps,
  Legend as RcLegend,
  Pie as RcPie,
  PieChart as RcPieChart,
  Sector as RcSector,
  Tooltip as RcTooltip,
  ZIndexLayer as RcZIndexLayer,
} from 'recharts';

import {
  chartTooltipContentStyle,
  chartTooltipTextStyle,
  OpossumColors,
} from '../../shared-styles';
import type { ChartDataItem } from '../../types/types';
import { ChartActionTooltip } from '../ChartContainer/chart-action-tooltip';
import { ChartContainer } from '../ChartContainer/chart-container';
import { ChartTooltipContent } from '../ChartContainer/chart-tooltip-content';

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
  const [actionTooltipOpen, setActionTooltipOpen] = useState(false);

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
      <>
        <RcSector
          {...sectorProps}
          style={{
            filter: sectorProps.isActive ? 'brightness(0.9)' : undefined,
          }}
          onClick={item?.onActivate}
          cursor={item?.onActivate ? 'pointer' : undefined}
        />
        {/* Keep the foreground layer mounted while the active slice changes. */}
        <RcZIndexLayer zIndex={DefaultZIndexes.line}>
          {sectorProps.isActive && (
            <RcSector
              {...sectorProps}
              fill={'none'}
              stroke={OpossumColors.grey}
              strokeWidth={1}
              strokeLinejoin={'round'}
              pointerEvents={'none'}
              tabIndex={undefined}
              aria-hidden
            />
          )}
        </RcZIndexLayer>
      </>
    );
  }

  return (
    <ChartContainer width={'100%'} height={'100%'}>
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
          active={actionTooltipOpen ? false : undefined}
          wrapperStyle={{ zIndex: 1 }}
          contentStyle={chartTooltipContentStyle(theme)}
          itemStyle={chartTooltipTextStyle}
          content={(tooltipProps) => (
            <ChartTooltipContent
              item={props.segments[Number(tooltipProps.activeIndex)]}
              announce={tooltipProps.accessibilityLayer}
              style={{ ...tooltipProps.contentStyle, ...chartTooltipTextStyle }}
            />
          )}
        />
        <RcLegend
          content={
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
                    <ChartActionTooltip
                      description={item.actionDescription}
                      onOpenChange={setActionTooltipOpen}
                    >
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
                    </ChartActionTooltip>
                  ) : (
                    <div style={legendTextStyle}>{item.name}</div>
                  )}
                </div>
              ))}
            </div>
          }
          verticalAlign="middle"
          align="right"
          layout="vertical"
          width={LEGEND_WIDTH}
        />
      </RcPieChart>
    </ChartContainer>
  );
};
