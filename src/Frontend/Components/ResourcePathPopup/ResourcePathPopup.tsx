// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { useWindowHeight } from '../../util/use-window-height';
import { useAppSelector } from '../../state/hooks';
import { ButtonText } from '../../enums/enums';
import MuiBox from '@mui/material/Box';
import { treeClasses } from '../../shared-styles';
import { ResourcesTree } from '../ResourcesTree/ResourcesTree';
import { getAllResourcePathsForAttributions } from './resource-path-popup-helpers';
import {
  getExternalAttributionsToResources,
  getManualAttributionsToResources,
} from '../../state/selectors/all-views-resource-selectors';

const VERTICAL_SPACE_BETWEEN_TREE_AND_VIEWPORT_EDGES = 236;
const HORIZONTAL_SPACE_BETWEEN_TREE_AND_VIEWPORT_EDGES = 112;
const POPUP_CONTENT_PADDING = 48;

interface ResourcePathPopupProps {
  closePopup(): void;
  attributionIds: Array<string>;
  isExternalAttribution: boolean;
}

export function ResourcePathPopup(props: ResourcePathPopupProps): ReactElement {
  const externalAttributionsToResources = useAppSelector(
    getExternalAttributionsToResources
  );
  const manualAttributionsToResources = useAppSelector(
    getManualAttributionsToResources
  );
  const allResourcePaths = getAllResourcePathsForAttributions(
    props.attributionIds,
    props.isExternalAttribution
      ? externalAttributionsToResources
      : manualAttributionsToResources
  );
  const maxTreeHeight: number =
    useWindowHeight() - VERTICAL_SPACE_BETWEEN_TREE_AND_VIEWPORT_EDGES;
  const header = `Resources for selected ${
    props.isExternalAttribution ? 'signal' : 'attribution'
  }`;

  return (
    <NotificationPopup
      header={header}
      headerSx={treeClasses.header(POPUP_CONTENT_PADDING)}
      rightButtonConfig={{
        onClick: props.closePopup,
        buttonText: ButtonText.Close,
      }}
      onBackdropClick={props.closePopup}
      onEscapeKeyDown={props.closePopup}
      content={
        <MuiBox
          sx={treeClasses.treeContainer(
            VERTICAL_SPACE_BETWEEN_TREE_AND_VIEWPORT_EDGES
          )}
        >
          <ResourcesTree
            resourcePaths={allResourcePaths}
            highlightSelectedResources={true}
            maxHeight={maxTreeHeight}
            sx={treeClasses.tree(
              'popup',
              HORIZONTAL_SPACE_BETWEEN_TREE_AND_VIEWPORT_EDGES,
              POPUP_CONTENT_PADDING
            )}
          />
        </MuiBox>
      }
      isOpen={true}
      fullWidth={false}
    />
  );
}
