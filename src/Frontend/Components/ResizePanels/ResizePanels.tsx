// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import SearchIcon from '@mui/icons-material/Search';
import { Resizable } from 're-resizable';
import { useEffect, useRef, useState } from 'react';

import { TRANSITION } from '../../shared-styles';
import { ResizableBox } from '../ResizableBox/ResizableBox';
import { ResizeButton } from './ResizeButton/ResizeButton';
import {
  ClearButton,
  ClearIconWrapper,
  Header,
  HEADER_HEIGHT,
  HeaderText,
  Search,
  SearchIconWrapper,
  StyledInputBase,
} from './ResizePanels.style';

const GOLDEN_RATIO = 1.61803398875;

interface ResizePanel {
  component: React.ReactNode;
  title: string;
  search: string;
  setSearch: (search: string) => void;
  hidden?: boolean;
  headerTestId?: string;
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
  const containerRef = useRef<Resizable>(null);

  const isLowerCollapsed = effectiveHeight <= HEADER_HEIGHT;
  const isUpperCollapsed =
    effectiveHeight >=
    (containerRef.current?.size.height ?? 0) - HEADER_HEIGHT - 1;

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
        {renderHeader({ ...upperPanel, showSearch: !isUpperCollapsed })}
        {upperPanel.component}
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
        minHeight={HEADER_HEIGHT}
        maxHeight={
          containerRef.current
            ? containerRef.current.size.height - HEADER_HEIGHT
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
        {renderHeader({
          ...lowerPanel,
          showResizeButtons: true,
          showSearch: !isLowerCollapsed,
        })}
        {lowerPanel.component}
      </ResizableBox>
    );
  }

  function renderHeader({
    title,
    search,
    setSearch,
    showResizeButtons,
    showSearch,
    headerTestId,
  }: Pick<ResizePanel, 'title' | 'search' | 'setSearch' | 'headerTestId'> & {
    title: string;
    showResizeButtons?: boolean;
    showSearch: boolean;
  }) {
    return (
      <Header data-testid={headerTestId} square>
        <HeaderText color={'ghostwhite'}>{title}</HeaderText>
        {showSearch && renderSearchButton({ search, setSearch })}
        {showResizeButtons && renderDownResizeButton()}
        {showResizeButtons && renderUpResizeButton()}
      </Header>
    );
  }

  function renderSearchButton({
    search,
    setSearch,
  }: Pick<ResizePanel, 'search' | 'setSearch'>) {
    return (
      <Search hasValue={!!search}>
        <SearchIconWrapper>
          <SearchIcon color={'secondary'} fontSize={'inherit'} />
        </SearchIconWrapper>
        <StyledInputBase
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          spellCheck={false}
          type={'search'}
        />
        {!!search && (
          <ClearIconWrapper>
            <ClearButton
              onClick={() => setSearch('')}
              aria-label={'clear search'}
              color={'secondary'}
              fontSize={'inherit'}
            />
          </ClearIconWrapper>
        )}
      </Search>
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
              ? setHeight(HEADER_HEIGHT)
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
              : setHeight(containerRef.current.size.height - HEADER_HEIGHT);
          }
          setIsResizing(false);
        }}
      />
    );
  }
};
