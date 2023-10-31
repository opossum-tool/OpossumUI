// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { ReactElement, useState } from 'react';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { closePopup } from '../../state/actions/view-actions/view-actions';
import { ButtonText } from '../../enums/enums';
import { ResourcesList } from '../ResourcesList/ResourcesList';
import { FileSearchTextField } from '../FileSearchTextField/FileSearchTextField';
import { useAppDispatch } from '../../state/hooks';

export function FileSearchPopup(): ReactElement {
  const dispatch = useAppDispatch();
  const [filteredPaths, setFilteredPaths] = useState<Array<string>>([]);

  function close(): void {
    dispatch(closePopup());
  }

  const content = (
    <>
      <FileSearchTextField setFilteredPaths={setFilteredPaths} />
      <ResourcesList
        resourcesListBatches={[{ resourceIds: filteredPaths }]}
        onClickCallback={close}
      />
    </>
  );

  return (
    <NotificationPopup
      content={content}
      header={'Search for Files and Directories'}
      isOpen={true}
      rightButtonConfig={{
        onClick: close,
        buttonText: ButtonText.Cancel,
      }}
      onBackdropClick={close}
      onEscapeKeyDown={close}
      fullWidth
      fullHeight
    />
  );
}
