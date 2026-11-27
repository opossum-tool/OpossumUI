// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { ComponentProps } from 'react';

import {
  type PanelWidthSetting,
  usePanelSizes,
} from '../../state/variables/use-panel-sizes';
import { ResizableBox } from '../ResizableBox/ResizableBox';
import { SIDE_PANEL_MAX_WIDTH, SIDE_PANEL_MIN_WIDTH } from './workspace-layout';

interface Props extends Partial<
  Pick<
    ComponentProps<typeof ResizableBox>,
    'children' | 'style' | 'className' | 'ref'
  >
> {
  widthSetting: PanelWidthSetting;
  resizeFrom: 'left' | 'right';
}

export function WorkspaceSidePanel({
  children,
  widthSetting,
  resizeFrom,
  style,
  ...props
}: Props) {
  const { panelSizes, setPanelSizes } = usePanelSizes();

  return (
    <ResizableBox
      {...props}
      enable={{ [resizeFrom]: true }}
      size={{ height: '100%', width: panelSizes[widthSetting] }}
      minWidth={SIDE_PANEL_MIN_WIDTH}
      maxWidth={SIDE_PANEL_MAX_WIDTH}
      bounds="parent"
      boundsByDirection
      onResizeStop={(_event, _direction, ref) => {
        setPanelSizes({ [widthSetting]: ref.offsetWidth });
      }}
      style={{ overflow: 'visible', ...style }}
    >
      {children}
    </ResizableBox>
  );
}
