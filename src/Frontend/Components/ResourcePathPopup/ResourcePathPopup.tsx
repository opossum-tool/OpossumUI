// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import MuiBox from '@mui/material/Box';
import { ReactElement } from 'react';
import { ButtonText } from '../../enums/enums';
import { OpossumColors } from '../../shared-styles';
import { useAppSelector } from '../../state/hooks';
import {
  getExternalAttributionsToResources,
  getManualAttributionsToResources,
} from '../../state/selectors/all-views-resource-selectors';
import { useWindowHeight } from '../../util/use-window-height';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { ResourcesTree } from '../ResourcesTree/ResourcesTree';
import { getAllResourcePathsForAttributions } from './resource-path-popup-helpers';

const VERTICAL_SPACE_BETWEEN_TREE_AND_VIEWPORT_EDGES = 236;
const POPUP_CONTENT_PADDING = 48;

const classes = {
  tree: {
    background: OpossumColors.white,
    position: 'relative',
  },
  header: {
    whiteSpace: 'nowrap',
    width: `calc(100% - ${POPUP_CONTENT_PADDING}px)`,
  },
  container: {
    overflow: 'hidden',
    height: `calc(100vh - ${VERTICAL_SPACE_BETWEEN_TREE_AND_VIEWPORT_EDGES}px)`,
  },
};

interface ResourcePathPopupProps {
  closePopup(): void;
  attributionIds: Array<string>;
  isExternalAttribution: boolean;
}

export function ResourcePathPopup(props: ResourcePathPopupProps): ReactElement {
  const externalAttributionsToResources = useAppSelector(
    getExternalAttributionsToResources,
  );
  const manualAttributionsToResources = useAppSelector(
    getManualAttributionsToResources,
  );
  const allResourcePaths = getAllResourcePathsForAttributions(
    props.attributionIds,
    props.isExternalAttribution
      ? externalAttributionsToResources
      : manualAttributionsToResources,
  );
  const maxTreeHeight: number =
    useWindowHeight() - VERTICAL_SPACE_BETWEEN_TREE_AND_VIEWPORT_EDGES;
  const header = `Resources for selected ${
    props.isExternalAttribution ? 'signal' : 'attribution'
  }`;

  return (
    <NotificationPopup
      header={header}
      headerSx={classes.header}
      rightButtonConfig={{
        onClick: props.closePopup,
        buttonText: ButtonText.Close,
      }}
      onBackdropClick={props.closePopup}
      onEscapeKeyDown={props.closePopup}
      content={
        <MuiBox sx={classes.container}>
          <ResourcesTree
            resourcePaths={allResourcePaths}
            highlightSelectedResources={true}
            maxHeight={maxTreeHeight}
            sx={classes.tree}
          />
        </MuiBox>
      }
      isOpen={true}
      fullWidth
    />
  );
}
