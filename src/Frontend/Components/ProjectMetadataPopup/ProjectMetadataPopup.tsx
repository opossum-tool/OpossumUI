// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { text } from '../../../shared/text';
import { useCloseGlobalPopup } from '../GlobalPopup/popup-close-context';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { ProjectMetadataTable } from '../ProjectMetadataTable/ProjectMetadataTable';

export const ProjectMetadataPopup: React.FC = () => {
  const closePopup = useCloseGlobalPopup();

  function close(): void {
    closePopup();
  }

  return (
    <NotificationPopup
      header={'Project Metadata'}
      isOpen={true}
      classification={'reference'}
      fullWidth={false}
      rightButtonConfig={{ onClick: close, buttonText: text.buttons.close }}
      onBackdropClick={close}
      onEscapeKeyDown={close}
      aria-label={'project metadata'}
    >
      <ProjectMetadataTable />
    </NotificationPopup>
  );
};
