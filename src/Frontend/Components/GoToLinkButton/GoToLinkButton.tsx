// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { ReactElement } from 'react';

import { OpenLinkArgs } from '../../../shared/shared-types';
import { PopupType } from '../../enums/enums';
import { clickableIcon, disabledIcon } from '../../shared-styles';
import { openPopup } from '../../state/actions/view-actions/view-actions';
import { getParents } from '../../state/helpers/get-parents';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  getAttributionBreakpoints,
  getBaseUrlsForSources,
  getSelectedResourceId,
} from '../../state/selectors/resource-selectors';
import { IconButton } from '../IconButton/IconButton';

export function GoToLinkButton(): ReactElement | null {
  const path = useAppSelector(getSelectedResourceId);
  const baseUrlsForSources = useAppSelector(getBaseUrlsForSources);
  const attributionBreakpoints = useAppSelector(getAttributionBreakpoints);
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
        attributionBreakpoints.has(parent) ||
        attributionBreakpoints.has(path) ||
        baseUrlOfParent === null
      ) {
        break;
      }

      if (parent in baseUrlsForSources) {
        const pathWithoutParentWithUrl = path.replace(
          new RegExp(`^${parent}`),
          '',
        );
        const pathWithoutLeadingAndTrailingSlashes = pathWithoutParentWithUrl
          .replace(/^\//, '')
          .replace(/\/$/, '');
        link = baseUrlOfParent.replace(
          '{path}',
          pathWithoutLeadingAndTrailingSlashes,
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
    void window.electronAPI.openLink(openLinkArgs.link).then((result) => {
      if (result instanceof Error) {
        dispatch(openPopup(PopupType.InvalidLinkPopup));
      }
    });
  }

  return (
    <IconButton
      tooltipTitle={
        openLinkArgs.link
          ? isLocalLink(openLinkArgs.link)
            ? 'Open file'
            : 'Open resource in browser'
          : 'No link available'
      }
      tooltipPlacement="left"
      onClick={onClick}
      icon={
        <OpenInNewIcon
          sx={openLinkArgs.link ? clickableIcon : disabledIcon}
          aria-label={'link to open'}
        />
      }
      disabled={!openLinkArgs.link}
    />
  );
}
