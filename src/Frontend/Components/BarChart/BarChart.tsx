// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiLink from '@mui/material/Link';
import { useTheme } from '@mui/material/styles';
import {
  type BarShapeProps,
  Bar as RcBar,
  BarChart as RcBarChart,
  Label as RcLabel,
  Rectangle as RcRectangle,
  ResponsiveContainer as RcResponsiveContainer,
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

// Chart plot-area geometry in px, consumed numerically by recharts
const MARGIN_LEFT = 8;
const MARGIN_RIGHT = 10;
const MARGIN_BOTTOM = 4;
const X_AXIS_LABEL_OFFSET = 3;

function BarChartLabel({
  tick,
  item,
  style,
}: {
  tick: YAxisTickContentProps;
  item: ChartDataItem | undefined;
  style: React.CSSProperties;
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
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          height: '100%',
          textAlign: 'right',
        }}
      >
        {/* Measure words independently of the visible label's wrapping width. */}
        <span
          aria-hidden
          className={tick.className}
          style={{
            position: 'absolute',
            visibility: 'hidden',
            pointerEvents: 'none',
            width: 'min-content',
          }}
        >
          {item?.name}
        </span>
        <div style={{ width: '100%' }}>
          {item?.onActivate ? (
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
          ) : (
            <span aria-label={item?.name}>{item?.name}</span>
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
    <RcResponsiveContainer width={'100%'} height={'100%'}>
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
            />
          )}
        />
        <RcTooltip
          cursor={{ fill: OpossumColors.lighterBlue }}
          contentStyle={chartTooltipContentStyle(theme)}
          itemStyle={chartTooltipTextStyle}
          labelStyle={chartTooltipTextStyle}
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
    </RcResponsiveContainer>
  );
};
