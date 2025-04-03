// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { text } from '../../../shared/text';
import { closePopup } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch } from '../../state/hooks';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { ProjectMetadataTable } from '../ProjectMetadataTable/ProjectMetadataTable';

export const ProjectMetadataPopup: React.FC = () => {
  const dispatch = useAppDispatch();

  function close(): void {
    dispatch(closePopup());
  }

  return (
    <NotificationPopup
      content={<ProjectMetadataTable />}
      header={'Project Metadata'}
      isOpen={true}
      fullWidth={false}
      rightButtonConfig={{
        onClick: close,
        buttonText: text.buttons.close,
      }}
      onBackdropClick={close}
      onEscapeKeyDown={close}
      aria-label={'project metadata'}
    />
  );
};
