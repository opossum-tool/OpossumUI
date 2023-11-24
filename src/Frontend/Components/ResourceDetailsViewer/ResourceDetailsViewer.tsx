// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import { ReactElement, useEffect, useState } from 'react';

import { PackagePanelTitle } from '../../enums/enums';
import {
  ADD_NEW_ATTRIBUTION_BUTTON_ID,
  EMPTY_DISPLAY_PACKAGE_INFO,
} from '../../shared-constants';
import { OpossumColors } from '../../shared-styles';
import { setTemporaryDisplayPackageInfo } from '../../state/actions/resource-actions/all-views-simple-actions';
import { setDisplayedPackage } from '../../state/actions/resource-actions/audit-view-simple-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  getAttributionBreakpoints,
  getDisplayedPackage,
} from '../../state/selectors/all-views-resource-selectors';
import {
  getAttributionIdsOfSelectedResource,
  getAttributionIdsOfSelectedResourceClosestParent,
  getSelectedResourceId,
} from '../../state/selectors/audit-view-resource-selectors';
import { PanelPackage } from '../../types/types';
import { isIdOfResourceWithChildren } from '../../util/can-resource-have-children';
import { getAttributionBreakpointCheck } from '../../util/is-attribution-breakpoint';
import { ManualPackagePanel } from '../ManualPackagePanel/ManualPackagePanel';
import { PathBar } from '../PathBar/PathBar';
import { FolderProgressBar } from '../ProgressBar/FolderProgressBar';
import { ResizableBox } from '../ResizableBox/ResizableBox';
import { ResourceDetailsAttributionColumn } from '../ResourceDetailsAttributionColumn/ResourceDetailsAttributionColumn';
import { ResourceDetailsTabs } from '../ResourceDetailsTabs/ResourceDetailsTabs';

const classes = {
  root: {
    background: OpossumColors.lightestBlue,
    flex: 1,
    padding: '8px',
  },
  columnDiv: {
    display: 'flex',
    marginTop: '8px',
    height: 'calc(100% - 32px)',
  },
  packageColumn: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    marginRight: '4px',
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
    useAppSelector(getAttributionIdsOfSelectedResourceClosestParent);
  const attributionIdsOfSelectedResource: Array<string> | null = useAppSelector(
    getAttributionIdsOfSelectedResource,
  );
  const attributionBreakpoints = useAppSelector(getAttributionBreakpoints);
  const resourceIsAttributionBreakpoint = getAttributionBreakpointCheck(
    attributionBreakpoints,
  )(selectedResourceId);
  const dispatch = useAppDispatch();

  useEffect(() => {
    setOverrideParentMode(false);
  }, [selectedResourceId, attributionIdsOfSelectedResource]);

  const parentOfSelectedResourceHasAttributions = Boolean(
    attributionIdsOfSelectedResourceClosestParent.length,
  );
  const selectedResourceHasAttributions = Boolean(
    attributionIdsOfSelectedResource?.length,
  );

  const showParentAttributions: boolean =
    !selectedResourceHasAttributions &&
    parentOfSelectedResourceHasAttributions &&
    !overrideParentMode;

  function onOverrideParentClick(): void {
    setOverrideParentMode(true);
    dispatch(setTemporaryDisplayPackageInfo(EMPTY_DISPLAY_PACKAGE_INFO));
    dispatch(
      setDisplayedPackage({
        panel: PackagePanelTitle.ManualPackages,
        packageCardId: ADD_NEW_ATTRIBUTION_BUTTON_ID,
        displayPackageInfo: EMPTY_DISPLAY_PACKAGE_INFO,
      }),
    );
  }

  const showProgressBar = isIdOfResourceWithChildren(selectedResourceId);

  return selectedResourceId && displayedPackage ? (
    <MuiBox aria-label={'resource details'} sx={classes.root}>
      <PathBar />
      <MuiBox sx={classes.columnDiv}>
        <ResizableBox
          sx={classes.packageColumn}
          defaultSize={{ width: '30%', height: 'auto' }}
          minWidth={240}
        >
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
        </ResizableBox>
        <ResourceDetailsAttributionColumn
          showParentAttributions={showParentAttributions}
        />
      </MuiBox>
    </MuiBox>
  ) : null;
}
