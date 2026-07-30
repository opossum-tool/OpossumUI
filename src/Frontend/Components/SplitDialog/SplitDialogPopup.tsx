// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { closePopup } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch } from '../../state/hooks';
import { SplitDialog } from './SplitDialog';

interface SplitDialogPopupProps {
  resourcePath?: string;
}

export const SplitDialogPopup: React.FC<SplitDialogPopupProps> = ({
  resourcePath,
}) => {
  const dispatch = useAppDispatch();

  return (
    <SplitDialog
      open={true}
      resourcePath={resourcePath}
      onClose={() => dispatch(closePopup())}
    />
  );
};
