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

// Splits a label into at most two lines. Pure CSS wrapping alone would not
// work here: it is unbounded, so labels wrapping to 3+ lines overflow the
// fixed row height, and it breaks inside hyphenated words. Explicitly
// splitting at whitespace keeps hyphenated words intact, and the split is
// balanced by character count so both lines are roughly equal width; the
// reserved tick width then only needs to fit the widest line instead of the
// whole label. Labels that already fit on one line ("First Party") are left
// alone, so they render exactly like before.
function wrapChartTickLabel(label: string): Array<string> {
  const words = label.trim().split(/\s+/);
  if (words.length < 2) {
    return [label];
  }
  let bestSplitIndex = 1;
  let bestCost = Number.POSITIVE_INFINITY;
  for (let splitIndex = 1; splitIndex < words.length; splitIndex++) {
    const firstLine = words.slice(0, splitIndex).join(' ');
    const secondLine = words.slice(splitIndex).join(' ');
    const cost = Math.max(firstLine.length, secondLine.length);
    if (cost < bestCost) {
      bestCost = cost;
      bestSplitIndex = splitIndex;
    }
  }
  return [
    words.slice(0, bestSplitIndex).join(' '),
    words.slice(bestSplitIndex).join(' '),
  ];
}

function ChartTickLabelLines({ label }: { label: string }) {
  return (
    <div style={{ whiteSpace: 'pre-line' }}>
      {wrapChartTickLabel(label).join('\n')}
    </div>
  );
}

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
          style={{ width: 'max-content', flexShrink: 0 }}
        >
          {item?.onActivate ? (
            <ChartActionTooltip
              description={item.actionDescription}
              onOpenChange={onTooltipOpenChange}
            >
              <MuiLink
                aria-label={item.name}
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
                <ChartTickLabelLines label={item.name} />
              </MuiLink>
            </ChartActionTooltip>
          ) : (
            <ChartTickLabelLines label={item?.name ?? ''} />
          )}
        </div>
      </div>
    </foreignObject>
  );
}

interface BarChartProps {
  data: Array<ChartDataItem>;
  axisLabel?: string;
}

export const BarChart: React.FC<BarChartProps> = (props) => {
  const theme = useTheme();
  const [actionTooltipOpen, setActionTooltipOpen] = useState(false);
  const axisLabel = props.axisLabel ?? text.projectStatisticsPopup.charts.count;

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
            value={axisLabel}
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
          name={axisLabel}
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
