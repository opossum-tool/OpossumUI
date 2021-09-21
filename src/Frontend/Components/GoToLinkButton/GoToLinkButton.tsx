// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { useSelector } from 'react-redux';
import { getSelectedResourceId } from '../../state/selectors/audit-view-resource-selectors';
import {
  getAttributionBreakpoints,
  getBaseUrlsForSources,
} from '../../state/selectors/all-views-resource-selectors';
import { GoToLinkIcon } from '../Icons/Icons';
import { IpcChannel } from '../../../shared/ipc-channels';
import clsx from 'clsx';
import { getParents } from '../../state/helpers/get-parents';
import { getAttributionBreakpointCheck } from '../../util/is-attribution-breakpoint';
import { OpenLinkArgs } from '../../../shared/shared-types';

const useStyles = makeStyles({
  hidden: {
    visibility: 'hidden',
  },
});

interface GoToLinkProps {
  className?: string;
}

export function GoToLinkButton(props: GoToLinkProps): ReactElement {
  const classes = useStyles();
  const path = useSelector(getSelectedResourceId);
  const baseUrlsForSources = useSelector(getBaseUrlsForSources);
  const attributionBreakpoints = useSelector(getAttributionBreakpoints);
  const isAttributionBreakpoint = getAttributionBreakpointCheck(
    attributionBreakpoints
  );

  function getOpenLinkArgs(): OpenLinkArgs {
    const sortedParents = getParents(path).sort((a, b) => b.length - a.length);

    let link = '';
    for (let index = 0; index < sortedParents.length; index++) {
      const parent = sortedParents[index];
      if (isAttributionBreakpoint(parent) || isAttributionBreakpoint(path)) {
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
        link = baseUrlsForSources[parent].replace(
          '{path}',
          pathWithoutLeadingAndTrailingSlashes
        );
        break;
      }
    }

    return { link };
  }

  const openLinkArgs = getOpenLinkArgs();

  return (
    <GoToLinkIcon
      className={clsx(!openLinkArgs.link && classes.hidden, props.className)}
      label={'link to open'}
      onClick={(): void => {
        window.ipcRenderer.invoke(IpcChannel.OpenLink, openLinkArgs);
      }}
    />
  );
}
