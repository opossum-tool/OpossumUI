// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useState } from 'react';

import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import { FileFormatInfo } from '../../../shared/shared-types';
import {
  ShowImportDialogListener,
  useIpcRenderer,
} from '../../util/use-ipc-renderer';
import { ImportDialog } from './ImportDialog';

export const ImportDialogProvider: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [fileFormat, setFileFormat] = useState<FileFormatInfo>();

  useIpcRenderer<ShowImportDialogListener>(
    AllowedFrontendChannels.ImportFileShowDialog,
    (_, fileFormat) => {
      setFileFormat(fileFormat);
      setIsOpen(true);
    },
    [],
  );

  return isOpen && fileFormat ? (
    <ImportDialog
      fileFormat={fileFormat}
      closeDialog={() => setIsOpen(false)}
    />
  ) : undefined;
};
