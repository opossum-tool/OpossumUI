// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import MuiBox from '@mui/material/Box';
import { compact } from 'lodash';
import { ReactElement } from 'react';

import { clickableIcon } from '../../shared-styles';
import { setSelectedResourceIdOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { getSelectedResourceId } from '../../state/selectors/audit-view-resource-selectors';
import { Breadcrumbs } from '../Breadcrumbs/Breadcrumbs';
import { GoToLinkButton } from '../GoToLinkButton/GoToLinkButton';
import { IconButton } from '../IconButton/IconButton';

const classes = {
  root: {
    padding: '0 6px',
    display: 'flex',
    alignItems: 'center',
  },
};

export function PathBar(): ReactElement | null {
  const resourceId = useAppSelector(getSelectedResourceId);
  const dispatch = useAppDispatch();

  const pathElements = compact(resourceId.split('/'));

  const getPathToResource = (resourceName: string): string => {
    const elements = resourceId.split('/');
    return elements
      .slice(0, elements.indexOf(resourceName) + 1)
      .concat('')
      .join('/');
  };

  return pathElements.length > 0 ? (
    <MuiBox aria-label={'path bar'} sx={classes.root}>
      <IconButton
        icon={<ContentCopyIcon aria-label={'copy path'} sx={clickableIcon} />}
        onClick={async (): Promise<void> => {
          await navigator.clipboard.writeText(pathElements.join('/'));
        }}
        tooltipPlacement={'left'}
        tooltipTitle={'copy path to clipboard'}
        aria-label={'copy path'}
      />
      <GoToLinkButton />
      <Breadcrumbs
        idsToDisplayValues={pathElements.map((element) => [element, element])}
        maxItems={5}
        onClick={(id): void =>
          dispatch(
            setSelectedResourceIdOrOpenUnsavedPopup(getPathToResource(id)),
          )
        }
        key={resourceId}
        selectedId={pathElements[pathElements.length - 1]}
      />
    </MuiBox>
  ) : null;
}
