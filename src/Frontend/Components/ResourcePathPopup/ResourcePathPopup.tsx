// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { ReactElement } from 'react';
import { ButtonText } from '../../enums/enums';
import { OpossumColors } from '../../shared-styles';
import { useAppSelector } from '../../state/hooks';
import {
  getExternalAttributionsToResources,
  getManualAttributionsToResources,
} from '../../state/selectors/all-views-resource-selectors';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { ResourcesTree } from '../ResourcesTree/ResourcesTree';
import { getAllResourcePathsForAttributions } from './resource-path-popup-helpers';

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
        <ResourcesTree
          resourcePaths={allResourcePaths}
          highlightSelectedResources={true}
          sx={classes.tree}
        />
      }
      isOpen={true}
      fullWidth
      fullHeight
    />
  );
}
