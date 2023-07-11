// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { Resources } from '../../../shared/shared-types';
import { PathPredicate } from '../../types/types';
import React, { ReactElement } from 'react';
import { GeneralTreeItemLabel } from '../GeneralTreeItemLabel/GeneralTreeItemLabel';

export function getGeneralTreeItemLabel(
  resourceName: string,
  resource: Resources | 1,
  nodeId: string,
  isAttributionBreakpoint: PathPredicate,
  isFileWithChildren: PathPredicate,
): ReactElement {
  const canHaveChildren = resource !== 1;

  return (
    <GeneralTreeItemLabel
      labelText={getDisplayName(resourceName)}
      canHaveChildren={canHaveChildren}
      isAttributionBreakpoint={isAttributionBreakpoint(nodeId)}
      showFolderIcon={canHaveChildren && !isFileWithChildren(nodeId)}
    />
  );
}

function getDisplayName(resourceName: string): string {
  return isRootResource(resourceName) ? '/' : resourceName;
}

function isRootResource(resourceName: string): boolean {
  return resourceName === '';
}
