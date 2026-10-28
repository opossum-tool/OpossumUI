// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiLink from '@mui/material/Link';
import { useTheme } from '@mui/material/styles';
import {
  Bar as RcBar,
  BarChart as RcBarChart,
  Cell as RcCell,
  Label as RcLabel,
  Rectangle as RcRectangle,
  ResponsiveContainer as RcResponsiveContainer,
  Tooltip as RcTooltip,
  XAxis as RcXAxis,
  YAxis as RcYAxis,
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

interface BarChartProps {
  data: Array<ChartDataItem>;
}

export const BarChart: React.FC<BarChartProps> = (props) => {
  const theme = useTheme();

  const tickStyle = {
    fontFamily: 'sans-serif',
    fontSize: theme.typography.caption.fontSize,
  } satisfies React.SVGProps<SVGTextElement>;

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
          tick={(tick) => {
            const item = props.data[tick.index];
            return (
              <foreignObject
                x={0}
                y={tick.y}
                width={Number(tick.x)}
                style={{
                  ...tickStyle,
                  lineHeight: theme.typography.caption.lineHeight,
                  height: '2lh',
                  transform: 'translateY(-50%)',
                  transformBox: 'fill-box',
                }}
              >
                <div
                  style={{
                    ...tickStyle,
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
                      <MuiLink
                        component={'button'}
                        type={'button'}
                        variant={'caption'}
                        underline={'hover'}
                        onClick={item.onActivate}
                        style={{ ...tickStyle, textAlign: 'right' }}
                      >
                        {item.name}
                      </MuiLink>
                    ) : (
                      <span>{item?.name}</span>
                    )}
                  </div>
                </div>
              </foreignObject>
            );
          }}
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
          onClick={(_, index) => props.data[index]?.onActivate?.()}
          // Keep zero-count entries so they also get clickable backgrounds.
          shape={<RcRectangle />}
          background={{ fill: 'transparent' }}
        >
          {props.data.map((item, index) => (
            <RcCell
              key={item.id ?? index}
              onClick={item.onActivate}
              cursor={item.onActivate ? 'pointer' : undefined}
            />
          ))}
        </RcBar>
      </RcBarChart>
    </RcResponsiveContainer>
  );
};
