// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiLink from '@mui/material/Link';
import { useTheme } from '@mui/material/styles';
import { useState } from 'react';
import {
  type BarShapeProps,
  Bar as RcBar,
  BarChart as RcBarChart,
  Label as RcLabel,
  Rectangle as RcRectangle,
  Tooltip as RcTooltip,
  XAxis as RcXAxis,
  YAxis as RcYAxis,
  type YAxisTickContentProps,
} from 'recharts';

import { text } from '../../../shared/text';
import {
  chartTooltipContentStyle,
  chartTooltipTextStyle,
  OpossumColors,
} from '../../shared-styles';
import type { ChartDataItem } from '../../types/types';
import { ChartActionTooltip } from '../ChartContainer/chart-action-tooltip';
import { ChartContainer } from '../ChartContainer/chart-container';
import { ChartTooltipContent } from '../ChartContainer/chart-tooltip-content';

// Chart plot-area geometry in px, consumed numerically by recharts
const MARGIN_LEFT = 8;
const MARGIN_RIGHT = 10;
const MARGIN_BOTTOM = 4;
const X_AXIS_LABEL_OFFSET = 3;

function BarChartLabel({
  tick,
  item,
  style,
  onTooltipOpenChange,
}: {
  tick: YAxisTickContentProps;
  item: ChartDataItem | undefined;
  style: React.CSSProperties;
  onTooltipOpenChange: (open: boolean) => void;
}) {
  const rowHeight =
    Number(tick.height ?? 0) / Math.max(1, tick.visibleTicksCount);

  return (
    <foreignObject
      x={MARGIN_LEFT}
      y={Number(tick.y) - rowHeight / 2}
      width={Math.max(0, Number(tick.x) - MARGIN_LEFT)}
      height={rowHeight}
      style={{ ...style, lineHeight: '1em', color: tick.fill }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          height: '100%',
          textAlign: 'right',
        }}
      >
        <div
          className={tick.className}
          style={{ width: 'min-content', flexShrink: 0 }}
        >
          {item?.onActivate ? (
            <ChartActionTooltip
              description={item.actionDescription}
              onOpenChange={onTooltipOpenChange}
            >
              <MuiLink
                component={'button'}
                type={'button'}
                variant={'caption'}
                underline={'hover'}
                onClick={item.onActivate}
                style={{
                  ...style,
                  lineHeight: 'inherit',
                  textAlign: 'right',
                  maxWidth: '100%',
                }}
              >
                {item.name}
              </MuiLink>
            </ChartActionTooltip>
          ) : (
            <span>{item?.name}</span>
          )}
        </div>
      </div>
    </foreignObject>
  );
}

interface BarChartProps {
  data: Array<ChartDataItem>;
}

export const BarChart: React.FC<BarChartProps> = (props) => {
  const theme = useTheme();
  const [actionTooltipOpen, setActionTooltipOpen] = useState(false);

  const tickStyle = {
    fontFamily: 'sans-serif',
    fontSize: theme.typography.caption.fontSize,
  } satisfies React.SVGProps<SVGTextElement>;

  function renderRectangle(rectangleProps: BarShapeProps) {
    const item = props.data[rectangleProps.originalDataIndex];
    return (
      <RcRectangle
        {...rectangleProps}
        onClick={item?.onActivate}
        cursor={item?.onActivate ? 'pointer' : undefined}
      />
    );
  }

  return (
    <ChartContainer width={'100%'} height={'100%'}>
      <RcBarChart
        layout={'vertical'}
        data={props.data}
        margin={{
          left: MARGIN_LEFT,
          right: MARGIN_RIGHT,
          bottom: MARGIN_BOTTOM,
        }}
      >
        <RcXAxis type={'number'} tick={tickStyle}>
          <RcLabel
            value={text.projectStatisticsPopup.charts.count}
            offset={-X_AXIS_LABEL_OFFSET}
            position={'insideBottom'}
            style={tickStyle}
          />
        </RcXAxis>
        <RcYAxis
          dataKey={'name'}
          type={'category'}
          width={'auto'}
          tick={(tick) => (
            <BarChartLabel
              tick={tick}
              item={props.data[tick.index]}
              style={tickStyle}
              onTooltipOpenChange={setActionTooltipOpen}
            />
          )}
        />
        <RcTooltip
          active={actionTooltipOpen ? false : undefined}
          cursor={{ fill: OpossumColors.lighterBlue }}
          contentStyle={chartTooltipContentStyle(theme)}
          itemStyle={chartTooltipTextStyle}
          labelStyle={chartTooltipTextStyle}
          content={(tooltipProps) => (
            <ChartTooltipContent
              item={props.data[Number(tooltipProps.activeIndex)]}
              announce={tooltipProps.accessibilityLayer}
              style={{ ...tooltipProps.contentStyle, ...chartTooltipTextStyle }}
            />
          )}
        />
        <RcBar
          name={text.projectStatisticsPopup.charts.count}
          dataKey={'count'}
          fill={OpossumColors.darkBlue}
          isAnimationActive={false}
          // Keep zero-count entries so they also get clickable backgrounds.
          shape={renderRectangle}
          background={(rectangleProps: BarShapeProps) =>
            renderRectangle({ ...rectangleProps, fill: 'transparent' })
          }
        />
      </RcBarChart>
    </ChartContainer>
  );
};
