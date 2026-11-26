// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import SearchIcon from '@mui/icons-material/Search';
import { useRef } from 'react';

import type { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import { useIpcRenderer } from '../../util/use-ipc-renderer';
import { SearchRefContext } from '../SearchRefContext/SearchRefContext';
import {
  ClearButton,
  ClearIconWrapper,
  Header,
  HeaderText,
  Search,
  SearchIconWrapper,
  StyledInputBase,
} from './ResizePanels.style';

interface Props {
  children: React.ReactNode;
  headerActions?: React.ReactNode;
  headerDataAttributes?: {
    [attributeName: `data-${string}`]: string | undefined;
  };
  headerTestId?: string;
  persistentHeaderActions?: React.ReactNode;
  search: {
    value: string;
    setValue: (search: string) => void;
    channel: AllowedFrontendChannels;
    inputLabel?: string;
  };
  showSearch?: boolean;
  title: string;
}

export const SearchablePanel: React.FC<Props> = ({
  children,
  headerActions,
  headerDataAttributes,
  headerTestId,
  persistentHeaderActions,
  search,
  showSearch = true,
  title,
}) => {
  const searchRef = useRef<HTMLInputElement>(null);

  useIpcRenderer(
    search.channel,
    () => {
      if (showSearch) {
        searchRef.current?.focus();
      }
    },
    [showSearch],
  );

  return (
    <>
      <Header data-testid={headerTestId} {...headerDataAttributes} square>
        <HeaderText>{title}</HeaderText>
        {showSearch && (
          <Search hasValue={!!search.value}>
            <SearchIconWrapper>
              <SearchIcon color={'secondary'} fontSize={'inherit'} />
            </SearchIconWrapper>
            <StyledInputBase
              value={search.value}
              onChange={(event) => search.setValue(event.target.value)}
              spellCheck={false}
              type={'search'}
              inputRef={searchRef}
              inputProps={{ 'aria-label': search.inputLabel }}
            />
            {!!search.value && (
              <ClearIconWrapper>
                <ClearButton
                  onClick={() => search.setValue('')}
                  aria-label={'clear search'}
                  color={'secondary'}
                  fontSize={'inherit'}
                />
              </ClearIconWrapper>
            )}
          </Search>
        )}
        {showSearch && headerActions}
        {persistentHeaderActions}
      </Header>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <SearchRefContext value={searchRef}>{children}</SearchRefContext>
      </div>
    </>
  );
};
