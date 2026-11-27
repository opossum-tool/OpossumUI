// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import useMediaQuery from '@mui/material/useMediaQuery';
import { type ReactNode, useLayoutEffect, useRef, useState } from 'react';

import type { PackageInfo } from '../../../shared/shared-types';
import { PICKER_MODE_DISABLED_OPACITY } from '../../shared-styles';
import type { Confirm } from '../ConfirmationDialog/ConfirmationDialog';
import type { PackagePatch } from './attribution-form.types';
import { AuditingOptions } from './AuditingOptions/AuditingOptions';

const classes = {
  formContainer: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    gap: 3,
    p: 5,
    pb: 0,
    overflow: 'hidden auto',
    transition: 'opacity 150ms ease',
  },
};

interface AttributionFormProps {
  packageInfo: PackageInfo;
  onUpdate: (patch: PackagePatch) => void;
  children: ReactNode;
  onEdit?: Confirm;
  label?: string;
  dimmed?: boolean;
  interactionBlocked?: boolean;
}

export function AttributionForm({
  packageInfo,
  onUpdate,
  children,
  label,
  onEdit,
  dimmed,
  interactionBlocked = false,
}: AttributionFormProps) {
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const headerContentRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState<number>();

  useLayoutEffect(() => {
    const content = headerContentRef.current;
    if (!content) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      const height = entry.contentRect.height;
      setHeaderHeight(height);
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  return (
    <MuiBox
      data-testid={'attribution-form-wrapper'}
      sx={{
        ...classes.formContainer,
        opacity: dimmed ? PICKER_MODE_DISABLED_OPACITY : 1,
      }}
      aria-label={label}
      inert={interactionBlocked}
    >
      <MuiBox
        sx={{
          height: headerHeight ?? 'auto',
          transition:
            headerHeight === undefined || reduceMotion
              ? 'none'
              : 'height 150ms ease-out',
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        <MuiBox ref={headerContentRef}>
          <AuditingOptions
            packageInfo={packageInfo}
            isEditable={!!onEdit}
            onUpdate={onUpdate}
            interactionBlocked={interactionBlocked}
          />
        </MuiBox>
      </MuiBox>
      {children}
    </MuiBox>
  );
}
