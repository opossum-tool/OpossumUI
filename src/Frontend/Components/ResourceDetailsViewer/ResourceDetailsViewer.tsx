// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { makeStyles } from '@material-ui/core/styles';
import React, { ReactElement, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
import { isAttributionBreakpoint } from '../../state/selectors/all-views-resource-selectors';

const useStyles = makeStyles({
  root: {
    background: OpossumColors.lightestBlue,
    flex: 1,
    padding: 8,
    width: `calc(100% - ${resourceBrowserWidthInPixels}px)`,
  },
  columnDiv: {
    display: 'flex',
    marginTop: 8,
    height: 'calc(100% - 32px)',
  },
  packageColumn: {
    display: 'flex',
    flexDirection: 'column',
    width: '30%',
    height: '100%',
    marginRight: 4,
    minWidth: 240,
  },
  tabsDiv: {
    overflowY: 'auto',
    marginTop: 8,
    flex: 1,
    paddingRight: 1,
  },
});

export function ResourceDetailsViewer(): ReactElement | null {
  const classes = useStyles();

  const [overrideParentMode, setOverrideParentMode] = useState<boolean>(false);

  const displayedPackage: PanelPackage | null =
    useSelector(getDisplayedPackage);
  const selectedResourceId = useSelector(getSelectedResourceId);
  const attributionIdsOfSelectedResourceClosestParent: Array<string> =
    useSelector(getAttributionIdsOfSelectedResourceClosestParent, isEqual);
  const attributionIdsOfSelectedResource: Array<string> = useSelector(
    getAttributionIdsOfSelectedResource,
    isEqual
  );
  const resourceIsAttributionBreakpoint: boolean = useSelector(
    isAttributionBreakpoint(selectedResourceId)
  );

  const dispatch = useDispatch();

  useEffect(() => {
    setOverrideParentMode(false);
  }, [selectedResourceId]);

  const parentOfSelectedResourceHasAttributions = Boolean(
    attributionIdsOfSelectedResourceClosestParent.length
  );
  const selectedResourceHasAttributions = Boolean(
    attributionIdsOfSelectedResource.length
  );

  const showParentAttributions: boolean =
    !selectedResourceHasAttributions &&
    parentOfSelectedResourceHasAttributions &&
    !overrideParentMode;

  function onOverrideParentClick(): void {
    setOverrideParentMode(true);
    dispatch(setTemporaryPackageInfo({}));
    dispatch(
      setDisplayedPackage({
        panel: PackagePanelTitle.ManualPackages,
        attributionId: '',
      })
    );
  }

  return selectedResourceId && displayedPackage ? (
    <div className={classes.root}>
      <PathBar />
      <div className={classes.columnDiv}>
        <div className={classes.packageColumn}>
          {!resourceIsAttributionBreakpoint && (
            <ManualPackagePanel
              showParentAttributions={showParentAttributions}
              overrideParentMode={overrideParentMode}
              showAddNewAttributionButton={!showParentAttributions}
              onOverrideParentClick={onOverrideParentClick}
            />
          )}
          <div className={classes.tabsDiv}>
            <ResourceDetailsTabs
              isAllAttributionsTabEnabled={!showParentAttributions}
              isAddToPackageEnabled={!resourceIsAttributionBreakpoint}
            />
          </div>
        </div>
        <ResourceDetailsAttributionColumn
          showParentAttributions={showParentAttributions}
        />
      </div>
    </div>
  ) : null;
}
