// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiPaper from '@mui/material/Paper';
import MuiTypography from '@mui/material/Typography';
import { Resizable } from 're-resizable';
import { useEffect, useRef, useState } from 'react';

import { OpossumColors, TRANSITION } from '../../shared-styles';
import { ResizableBox } from '../ResizableBox/ResizableBox';
import { ResizeButton } from './ResizeButton/ResizeButton';

const MIN_DIMENSION = 32;
const GOLDEN_RATIO = 1.61803398875;

type Main = 'upper' | 'lower';
const FRACTIONS: Record<Main, number> = {
  upper: 1 + GOLDEN_RATIO,
  lower: GOLDEN_RATIO,
};

interface ResizePanelsProps {
  height: number | null;
  lowerPanel: { component: React.ReactNode; title: string; hidden?: boolean };
  main: 'upper' | 'lower';
  maxWidth?: number;
  minWidth?: number;
  setHeight: (height: number) => void;
  setWidth: (width: number) => void;
  upperPanel: { component: React.ReactNode; title: string; hidden?: boolean };
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
  const effectiveHeight = height || 0;
  const fraction = FRACTIONS[main];
  const [isResizing, setIsResizing] = useState(true);
  const containerRef = useRef<Resizable>(null);

  useEffect(() => {
    const applyGoldenRatio = () =>
      containerRef.current &&
      setHeight(containerRef.current.size.height / fraction);

    heightIsNull && applyGoldenRatio();
    window.addEventListener('resize', applyGoldenRatio);

    return () => {
      window.removeEventListener('resize', applyGoldenRatio);
    };
  }, [fraction, heightIsNull, setHeight]);

  const isUpperCollapsed =
    effectiveHeight >=
    (containerRef.current?.size.height ?? 0) - MIN_DIMENSION - 1;
  const isLowerCollapsed = effectiveHeight <= MIN_DIMENSION;

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
      <>
        {renderTitle({ title: upperPanel.title })}
        {!isUpperCollapsed && upperPanel.component}
      </>
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
        minHeight={MIN_DIMENSION}
        maxHeight={
          containerRef.current
            ? containerRef.current.size.height - MIN_DIMENSION
            : undefined
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
        {renderTitle({ title: lowerPanel.title, showResizeButtons: true })}
        {!isLowerCollapsed && lowerPanel.component}
      </ResizableBox>
    );
  }

  function renderTitle({
    title,
    showResizeButtons,
  }: {
    title: string;
    showResizeButtons?: boolean;
  }) {
    return (
      <MuiPaper
        square
        sx={{
          background: OpossumColors.middleBlue,
          height: MIN_DIMENSION,
          minHeight: MIN_DIMENSION,
          position: 'relative',
          zIndex: 3,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '0 8px',
        }}
      >
        <MuiTypography
          variant={'body1'}
          color={'ghostwhite'}
          sx={{
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            paddingLeft: '8px',
            marginTop: '2px',
            userSelect: 'none',
            flex: 1,
          }}
        >
          {title}
        </MuiTypography>
        {showResizeButtons && renderDownResizeButton()}
        {showResizeButtons && renderUpResizeButton()}
      </MuiPaper>
    );
  }

  function renderDownResizeButton() {
    return (
      <ResizeButton
        invert={false}
        disabled={isLowerCollapsed}
        onClick={() => {
          setIsResizing(true);
          if (containerRef.current) {
            effectiveHeight <= containerRef.current.size.height / fraction
              ? setHeight(MIN_DIMENSION)
              : setHeight(containerRef.current.size.height / fraction);
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
          if (containerRef.current) {
            effectiveHeight < containerRef.current.size.height / fraction
              ? setHeight(containerRef.current.size.height / fraction)
              : setHeight(containerRef.current.size.height - MIN_DIMENSION);
          }
          setIsResizing(false);
        }}
      />
    );
  }
};
