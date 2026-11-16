// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useCloseGlobalPopup } from '../GlobalPopup/popup-close-context';
import { SplitDialog } from './SplitDialog';

interface SplitDialogPopupProps {
  resourcePath?: string;
}

export const SplitDialogPopup: React.FC<SplitDialogPopupProps> = ({
  resourcePath,
}) => {
  const closePopup = useCloseGlobalPopup();

  return (
    <SplitDialog open={true} resourcePath={resourcePath} onClose={closePopup} />
  );
};
