// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import SearchIcon from '@mui/icons-material/Search';
import { Resizable } from 're-resizable';
import { useEffect, useRef, useState } from 'react';

import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import { TRANSITION } from '../../shared-styles';
import { useIpcRenderer } from '../../util/use-ipc-renderer';
import { ResizableBox } from '../ResizableBox/ResizableBox';
import { SearchRefContext } from '../SearchRefContext/SearchRefContext';
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
  search: {
    value: string;
    setValue: (search: string) => void;
    channel: AllowedFrontendChannels;
  };
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
  const upperSearchRef = useRef<HTMLInputElement>(null);
  const lowerSearchRef = useRef<HTMLInputElement>(null);

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

  useIpcRenderer(
    upperPanel.search.channel,
    () => {
      if (!isUpperCollapsed) {
        upperSearchRef.current?.focus();
      }
    },
    [isUpperCollapsed],
  );

  useIpcRenderer(
    lowerPanel.search.channel,
    () => {
      if (!isLowerCollapsed) {
        lowerSearchRef.current?.focus();
      }
    },
    [isLowerCollapsed],
  );

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
        {renderHeader({
          ...upperPanel,
          showSearch: !isUpperCollapsed,
          searchRef: upperSearchRef,
        })}
        <SearchRefContext value={upperSearchRef}>
          {upperPanel.component}
        </SearchRefContext>
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
          searchRef: lowerSearchRef,
        })}
        <SearchRefContext value={lowerSearchRef}>
          {lowerPanel.component}
        </SearchRefContext>
      </ResizableBox>
    );
  }

  function renderHeader({
    title,
    search,
    showResizeButtons,
    searchRef,
    showSearch,
    headerTestId,
  }: Pick<ResizePanel, 'title' | 'search' | 'headerTestId'> & {
    title: string;
    showResizeButtons?: boolean;
    showSearch: boolean;
    searchRef: React.RefObject<HTMLInputElement | null>;
  }) {
    return (
      <Header data-testid={headerTestId} square>
        <HeaderText color={'ghostwhite'}>{title}</HeaderText>
        {showSearch && renderSearchButton({ search, searchRef })}
        {showResizeButtons && renderDownResizeButton()}
        {showResizeButtons && renderUpResizeButton()}
      </Header>
    );
  }

  function renderSearchButton({
    search: { value, setValue },
    searchRef,
  }: Pick<ResizePanel, 'search'> & {
    searchRef: React.RefObject<HTMLInputElement | null>;
  }) {
    return (
      <Search hasValue={!!value}>
        <SearchIconWrapper>
          <SearchIcon color={'secondary'} fontSize={'inherit'} />
        </SearchIconWrapper>
        <StyledInputBase
          value={value}
          onChange={(event) => setValue(event.target.value)}
          spellCheck={false}
          type={'search'}
          inputRef={searchRef}
        />
        {!!value && (
          <ClearIconWrapper>
            <ClearButton
              onClick={() => setValue('')}
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
