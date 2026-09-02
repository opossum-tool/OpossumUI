// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import MuiButton from '@mui/material/Button';
import MuiLinearProgress from '@mui/material/LinearProgress';
import { createContext, use } from 'react';

interface InfiniteListFooterContextValue {
  loading: boolean;
  error: unknown;
  onRetry: () => void;
}

export const InfiniteListFooterContext =
  createContext<InfiniteListFooterContextValue>({
    loading: false,
    error: null,
    onRetry: () => undefined,
  });

export function InfiniteListFooter() {
  return <InfiniteListFooterContent floating={false} />;
}

export function FloatingInfiniteListFooter() {
  return <InfiniteListFooterContent floating />;
}

function InfiniteListFooterContent({ floating }: { floating: boolean }) {
  const { loading, error, onRetry } = use(InfiniteListFooterContext);
  let footer: React.ReactNode = null;

  if (loading) {
    footer = <MuiLinearProgress />;
  } else if (error) {
    footer = (
      <MuiBox sx={{ display: 'flex', justifyContent: 'center', p: 1 }}>
        <MuiButton size={'small'} onClick={onRetry}>
          {'Retry'}
        </MuiButton>
      </MuiBox>
    );
  }

  return floating && footer ? (
    <MuiBox
      sx={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        zIndex: 1,
        backgroundColor: 'background.paper',
      }}
    >
      {footer}
    </MuiBox>
  ) : (
    footer
  );
}
