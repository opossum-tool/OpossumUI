// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { Resizable } from 're-resizable';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import type { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import { TRANSITION } from '../../shared-styles';
import { ResizableBox } from '../ResizableBox/ResizableBox';
import { ResizeButton } from './ResizeButton/ResizeButton';
import { HEADER_HEIGHT } from './ResizePanels.style';
import { SearchablePanel } from './searchable-panel';

const GOLDEN_RATIO = 1.61803398875;

interface ResizePanel {
  component: React.ReactNode;
  title: string;
  headerActions?: React.ReactNode;
  search: {
    value: string;
    setValue: (search: string) => void;
    channel: AllowedFrontendChannels;
    inputLabel?: string;
  };
  hidden?: boolean;
  headerTestId?: string;
  headerDataAttributes?: {
    [attributeName: `data-${string}`]: string | undefined;
  };
}

type Main = 'upper' | 'lower';

const FRACTIONS: Record<Main, number> = {
  upper: 1 + GOLDEN_RATIO,
  lower: GOLDEN_RATIO,
};

interface ResizePanelsProps {
  height: number | null;
  lowerPanel: ResizePanel;
  main: 'upper' | 'lower';
  maxWidth?: number;
  minWidth?: number;
  setHeight: (height: number) => void;
  setWidth: (width: number) => void;
  upperPanel: ResizePanel;
  width: number;
}

export const ResizePanels: React.FC<ResizePanelsProps> = ({
  height,
  lowerPanel,
  main,
  maxWidth,
  minWidth,
  setHeight,
  setWidth,
  upperPanel,
  width,
}) => {
  const heightIsNull = height === null;
  const effectiveHeight = height ?? 0;
  const fraction = FRACTIONS[main];
  const [isResizing, setIsResizing] = useState(true);
  const [containerHeight, setContainerHeight] = useState<number | undefined>(
    undefined,
  );
  const containerRef = useRef<Resizable>(null);

  const isLowerCollapsed = effectiveHeight <= HEADER_HEIGHT;
  const isUpperCollapsed =
    containerHeight !== undefined &&
    effectiveHeight >= containerHeight - HEADER_HEIGHT - 1;

  // Tracks real geometry changes of the container's DOM node via a
  // ResizeObserver. Must not run on every re-render: measuring and
  // setting state per render fights CSS transitions and the drag
  // mechanics of re-resizable, causing a resize feedback loop.
  useLayoutEffect(() => {
    const node = containerRef.current?.resizable;
    if (!node) {
      return;
    }
    const resizeObserver = new ResizeObserver(() => {
      setContainerHeight(node.offsetHeight);
    });
    resizeObserver.observe(node);
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const applyGoldenRatio = () =>
      containerHeight !== undefined && setHeight(containerHeight / fraction);

    if (!heightIsNull) {
      return;
    }
    applyGoldenRatio();
    window.addEventListener('resize', applyGoldenRatio);

    return () => {
      window.removeEventListener('resize', applyGoldenRatio);
    };
  }, [fraction, heightIsNull, setHeight, containerHeight]);

  return (
    <ResizableBox
      ref={containerRef}
      enable={{ right: true }}
      size={{ height: 'auto', width }}
      minWidth={minWidth}
      maxWidth={maxWidth}
      onResizeStart={() => setIsResizing(true)}
      onResizeStop={(_event, _direction, _ref, delta) => {
        setWidth(width + delta.width);
        setIsResizing(false);
      }}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        transition: isResizing ? undefined : TRANSITION,
      }}
    >
      {renderUpperPanel()}
      {renderLowerPanel()}
    </ResizableBox>
  );

  function renderUpperPanel() {
    if (upperPanel.hidden) {
      return null;
    }

    return (
      <SearchablePanel
        title={upperPanel.title}
        search={upperPanel.search}
        headerActions={upperPanel.headerActions}
        headerTestId={upperPanel.headerTestId}
        headerDataAttributes={upperPanel.headerDataAttributes}
        showSearch={!isUpperCollapsed}
      >
        {upperPanel.component}
      </SearchablePanel>
    );
  }

  function renderLowerPanel() {
    if (lowerPanel.hidden) {
      return null;
    }

    return (
      <ResizableBox
        enable={{ top: true }}
        size={{ height: height || '50%', width: 'auto' }}
        minHeight={HEADER_HEIGHT}
        maxHeight={
          containerHeight ? containerHeight - HEADER_HEIGHT : undefined
        }
        onResizeStart={() => setIsResizing(true)}
        onResizeStop={(_event, _direction, _ref, delta) => {
          setHeight(effectiveHeight + delta.height);
          setIsResizing(false);
        }}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          transition: isResizing ? undefined : TRANSITION,
        }}
      >
        <SearchablePanel
          title={lowerPanel.title}
          search={lowerPanel.search}
          headerActions={lowerPanel.headerActions}
          persistentHeaderActions={
            <>
              {renderDownResizeButton()}
              {renderUpResizeButton()}
            </>
          }
          headerTestId={lowerPanel.headerTestId}
          headerDataAttributes={lowerPanel.headerDataAttributes}
          showSearch={!isLowerCollapsed}
        >
          {lowerPanel.component}
        </SearchablePanel>
      </ResizableBox>
    );
  }

  function renderDownResizeButton() {
    return (
      <ResizeButton
        invert={false}
        disabled={isLowerCollapsed}
        onClick={() => {
          setIsResizing(true);
          if (containerHeight !== undefined) {
            effectiveHeight <= containerHeight / fraction
              ? setHeight(HEADER_HEIGHT)
              : setHeight(containerHeight / fraction);
          }
          setIsResizing(false);
        }}
      />
    );
  }

  function renderUpResizeButton() {
    return (
      <ResizeButton
        invert={true}
        disabled={isUpperCollapsed}
        onClick={() => {
          setIsResizing(true);
          if (containerHeight !== undefined) {
            effectiveHeight < containerHeight / fraction
              ? setHeight(containerHeight / fraction)
              : setHeight(containerHeight - HEADER_HEIGHT);
          }
          setIsResizing(false);
        }}
      />
    );
  }
};
