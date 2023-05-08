// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement, useEffect, useState } from 'react';
import { PanelPackage } from '../../types/types';
import { ManualPackagePanel } from '../ManualPackagePanel/ManualPackagePanel';
import { PathBar } from '../PathBar/PathBar';
import { ResourceDetailsTabs } from '../ResourceDetailsTabs/ResourceDetailsTabs';
import { ResourceDetailsAttributionColumn } from '../ResourceDetailsAttributionColumn/ResourceDetailsAttributionColumn';
import { PackagePanelTitle } from '../../enums/enums';
import { isEqual } from 'lodash';
import { setDisplayedPackage } from '../../state/actions/resource-actions/audit-view-simple-actions';
import { setTemporaryPackageInfo } from '../../state/actions/resource-actions/all-views-simple-actions';
import {
  getAttributionIdsOfSelectedResource,
  getAttributionIdsOfSelectedResourceClosestParent,
  getDisplayedPackage,
  getSelectedResourceId,
} from '../../state/selectors/audit-view-resource-selectors';
import {
  OpossumColors,
  resourceBrowserWidthInPixels,
} from '../../shared-styles';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { getAttributionBreakpointCheck } from '../../util/is-attribution-breakpoint';
import { getAttributionBreakpoints } from '../../state/selectors/all-views-resource-selectors';
import { isIdOfResourceWithChildren } from '../../util/can-resource-have-children';
import { FolderProgressBar } from '../ProgressBar/FolderProgressBar';
import MuiBox from '@mui/material/Box';
import { EMPTY_DISPLAY_PACKAGE_INFO } from '../../shared-constants';

const classes = {
  root: {
    background: OpossumColors.lightestBlue,
    flex: 1,
    padding: '8px',
    width: `calc(95% - ${resourceBrowserWidthInPixels}px)`,
  },
  columnDiv: {
    display: 'flex',
    marginTop: '8px',
    height: 'calc(100% - 32px)',
  },
  packageColumn: {
    display: 'flex',
    flexDirection: 'column',
    width: '30%',
    height: '100%',
    marginRight: '4px',
    minWidth: '240px',
  },
  tabsDiv: {
    overflowY: 'auto',
    marginTop: '8px',
    flex: 1,
    paddingRight: '1px',
  },
};

export function ResourceDetailsViewer(): ReactElement | null {
  const [overrideParentMode, setOverrideParentMode] = useState<boolean>(false);

  const displayedPackage: PanelPackage | null =
    useAppSelector(getDisplayedPackage);
  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const attributionIdsOfSelectedResourceClosestParent: Array<string> =
    useAppSelector(getAttributionIdsOfSelectedResourceClosestParent, isEqual);
  const attributionIdsOfSelectedResource: Array<string> | null = useAppSelector(
    getAttributionIdsOfSelectedResource
  );
  const attributionBreakpoints = useAppSelector(getAttributionBreakpoints);
  const resourceIsAttributionBreakpoint = getAttributionBreakpointCheck(
    attributionBreakpoints
  )(selectedResourceId);
  const dispatch = useAppDispatch();

  useEffect(() => {
    setOverrideParentMode(false);
  }, [selectedResourceId, attributionIdsOfSelectedResource]);

  const parentOfSelectedResourceHasAttributions = Boolean(
    attributionIdsOfSelectedResourceClosestParent.length
  );
  const selectedResourceHasAttributions = Boolean(
    attributionIdsOfSelectedResource?.length
  );

  const showParentAttributions: boolean =
    !selectedResourceHasAttributions &&
    parentOfSelectedResourceHasAttributions &&
    !overrideParentMode;

  function onOverrideParentClick(): void {
    setOverrideParentMode(true);
    dispatch(setTemporaryPackageInfo(EMPTY_DISPLAY_PACKAGE_INFO));
    dispatch(
      setDisplayedPackage({
        panel: PackagePanelTitle.ManualPackages,
        attributionId: '',
      })
    );
  }

  const showProgressBar = isIdOfResourceWithChildren(selectedResourceId);

  return selectedResourceId && displayedPackage ? (
    <MuiBox sx={classes.root}>
      <PathBar />
      <MuiBox sx={classes.columnDiv}>
        <MuiBox sx={classes.packageColumn}>
          {!resourceIsAttributionBreakpoint && (
            <ManualPackagePanel
              showParentAttributions={showParentAttributions}
              overrideParentMode={overrideParentMode}
              showAddNewAttributionButton={!showParentAttributions}
              onOverrideParentClick={onOverrideParentClick}
            />
          )}
          {showProgressBar && (
            <FolderProgressBar resourceId={selectedResourceId} />
          )}
          <MuiBox sx={classes.tabsDiv}>
            <ResourceDetailsTabs
              isGlobalTabEnabled={!showParentAttributions}
              isAddToPackageEnabled={!resourceIsAttributionBreakpoint}
            />
          </MuiBox>
        </MuiBox>
        <ResourceDetailsAttributionColumn
          showParentAttributions={showParentAttributions}
        />
      </MuiBox>
    </MuiBox>
  ) : null;
}
