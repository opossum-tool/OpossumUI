// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import { PopupType } from '../../enums/enums';
import { clickableIcon, disabledIcon } from '../../shared-styles';
import { openPopup } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { getSelectedResourceId } from '../../state/selectors/resource-selectors';
import { backend } from '../../util/backendClient';
import { IconButton } from '../IconButton/IconButton';

export const GoToLinkButton: React.FC = () => {
  const path = useAppSelector(getSelectedResourceId);
  const dispatch = useAppDispatch();

  function isLocalLink(link: string): boolean {
    return link.startsWith('file://');
  }

  const { data: link } = backend.getBaseUrlForSource.useQuery({
    sourcePath: path,
  });

  function onClick(): void {
    if (!link) {
      return;
    }
    void window.electronAPI.openLink(link).then((result) => {
      if (result instanceof Error) {
        dispatch(openPopup(PopupType.InvalidLinkPopup));
      }
    });
  }

  return (
    <IconButton
      tooltipTitle={
        link
          ? isLocalLink(link)
            ? 'Open file'
            : 'Open resource in browser'
          : 'No link available'
      }
      tooltipPlacement="left"
      onClick={onClick}
      icon={
        <OpenInNewIcon
          sx={link ? clickableIcon : disabledIcon}
          aria-label={'link to open'}
        />
      }
      disabled={!link}
    />
  );
};
