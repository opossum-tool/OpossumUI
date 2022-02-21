// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import makeStyles from '@mui/styles/makeStyles';
import { getSelectedResourceId } from '../../state/selectors/audit-view-resource-selectors';
import {
  getAttributionBreakpoints,
  getBaseUrlsForSources,
} from '../../state/selectors/all-views-resource-selectors';
import { IpcChannel } from '../../../shared/ipc-channels';
import clsx from 'clsx';
import { getParents } from '../../state/helpers/get-parents';
import { getAttributionBreakpointCheck } from '../../util/is-attribution-breakpoint';
import { OpenLinkArgs } from '../../../shared/shared-types';
import { IconButton } from '../IconButton/IconButton';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { clickableIcon } from '../../shared-styles';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { openPopup } from '../../state/actions/view-actions/view-actions';
import { PopupType } from '../../enums/enums';

const useStyles = makeStyles({
  hidden: {
    visibility: 'hidden',
  },
  clickableIcon,
});

interface GoToLinkProps {
  className?: string;
}

export function GoToLinkButton(props: GoToLinkProps): ReactElement {
  const classes = useStyles();
  const path = useAppSelector(getSelectedResourceId);
  const baseUrlsForSources = useAppSelector(getBaseUrlsForSources);
  const attributionBreakpoints = useAppSelector(getAttributionBreakpoints);
  const isAttributionBreakpoint = getAttributionBreakpointCheck(
    attributionBreakpoints
  );
  const dispatch = useAppDispatch();

  function getOpenLinkArgs(): OpenLinkArgs {
    const sortedParents = getParents(path)
      .concat([path])
      .sort((a, b) => b.length - a.length);

    let link = '';
    for (let index = 0; index < sortedParents.length; index++) {
      const parent = sortedParents[index];
      const baseUrlOfParent = baseUrlsForSources[parent];
      if (
        isAttributionBreakpoint(parent) ||
        isAttributionBreakpoint(path) ||
        baseUrlOfParent === null
      ) {
        break;
      }

      if (parent in baseUrlsForSources) {
        const pathWithoutParentWithUrl = path.replace(
          new RegExp(`^${parent}`),
          ''
        );
        const pathWithoutLeadingAndTrailingSlashes = pathWithoutParentWithUrl
          .replace(/^\//, '')
          .replace(/\/$/, '');
        link = baseUrlOfParent.replace(
          '{path}',
          pathWithoutLeadingAndTrailingSlashes
        );
        break;
      }
    }

    return { link };
  }

  function isLocalLink(link: string): boolean {
    return link.startsWith('file://');
  }

  const openLinkArgs = getOpenLinkArgs();

  function onClick(): void {
    window.ipcRenderer
      .invoke(IpcChannel.OpenLink, openLinkArgs)
      .then((result) => {
        if (result instanceof Error) {
          dispatch(openPopup(PopupType.InvalidLinkPopup));
        }
      });
  }

  return (
    <IconButton
      tooltipTitle={
        isLocalLink(openLinkArgs.link)
          ? 'open file'
          : 'open resource in browser'
      }
      placement="right"
      onClick={onClick}
      className={!openLinkArgs.link ? classes.hidden : undefined}
      icon={
        <OpenInNewIcon
          className={clsx(props.className, classes.clickableIcon)}
          aria-label={'link to open'}
        />
      }
    />
  );
}
