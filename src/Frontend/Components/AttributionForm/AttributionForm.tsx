// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import MuiDivider from '@mui/material/Divider';
import MuiTypography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import useEventCallback from '@mui/utils/useEventCallback';
import { useLayoutEffect, useRef, useState } from 'react';

import type { PackageInfo } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { PICKER_MODE_DISABLED_OPACITY } from '../../shared-styles';
import { setTemporaryDisplayPackageInfo } from '../../state/actions/resource-actions/all-views-simple-actions';
import { useAppDispatch } from '../../state/hooks';
import type { Confirm } from '../ConfirmationDialog/ConfirmationDialog';
import type { PackagePatch } from './attribution-form.types';
import { AttributionTypeField } from './attribution-type-field';
import { AuditingOptions } from './AuditingOptions/AuditingOptions';
import { Comment } from './Comment/Comment';
import { CopyrightSubPanel } from './CopyrightSubPanel/CopyrightSubPanel';
import { LicenseSubPanel } from './LicenseSubPanel/LicenseSubPanel';
import { PackageSubPanel } from './PackageSubPanel/PackageSubPanel';

const classes = {
  formContainer: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    gap: 3,
    p: 5,
    pb: 0,
    overflow: 'hidden auto',
    transition: 'opacity 150ms ease',
  },
  attributionTypeContainer: {
    position: 'relative',
  },
};

interface AttributionFormProps {
  packageInfo: PackageInfo;
  onEdit?: Confirm;
  label?: string;
  dimmed?: boolean;
  interactionBlocked?: boolean;
}

export function AttributionForm({
  packageInfo,
  label,
  onEdit,
  dimmed,
  interactionBlocked = false,
}: AttributionFormProps) {
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const headerContentRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState<number>();
  const dispatch = useAppDispatch();
  const showHighlight = !!onEdit;
  const updatePackageInfo = useEventCallback((patch: PackagePatch) => {
    if (interactionBlocked) {
      return;
    }
    dispatch(
      setTemporaryDisplayPackageInfo({
        ...packageInfo,
        ...patch,
      }),
    );
  });
  const onAttributionTypeChange = useEventCallback((firstParty: boolean) => {
    void onEdit?.(() => updatePackageInfo({ firstParty }));
  });

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
            onUpdate={updatePackageInfo}
            interactionBlocked={interactionBlocked}
          />
        </MuiBox>
      </MuiBox>
      <MuiDivider variant={'middle'}>
        <MuiTypography>
          {text.attributionColumn.packageCoordinates}
        </MuiTypography>
      </MuiDivider>
      <PackageSubPanel
        packageInfo={packageInfo}
        showHighlight={showHighlight}
        onEdit={onEdit}
        onUpdate={updatePackageInfo}
      />
      <MuiDivider variant={'middle'}>
        <MuiTypography>{text.attributionColumn.legalInformation}</MuiTypography>
      </MuiDivider>
      {renderAttributionType()}
      <CopyrightSubPanel
        packageInfo={packageInfo}
        showHighlight={showHighlight}
        onEdit={onEdit}
        hidden={packageInfo.firstParty}
        onUpdate={updatePackageInfo}
      />
      <LicenseSubPanel
        packageInfo={packageInfo}
        showHighlight={showHighlight}
        onEdit={onEdit}
        hidden={packageInfo.firstParty}
        onUpdate={updatePackageInfo}
      />
      <Comment
        packageInfo={packageInfo}
        onEdit={onEdit}
        onUpdate={updatePackageInfo}
      />
    </MuiBox>
  );

  function renderAttributionType() {
    return (
      <MuiBox sx={classes.attributionTypeContainer}>
        <AttributionTypeField
          value={packageInfo.firstParty}
          disabled={!onEdit}
          onChange={onAttributionTypeChange}
        />
      </MuiBox>
    );
  }
}
