// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { closePopup } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch } from '../../state/hooks';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';

export const TIME_POPUP_IS_DISPLAYED = 1500;

interface ErrorPopupProps {
  content: string;
}

export const ErrorPopup: React.FC<ErrorPopupProps> = (props) => {
  const dispatch = useAppDispatch();

  function close(): void {
    dispatch(closePopup());
  }

  setTimeout(() => close(), TIME_POPUP_IS_DISPLAYED);

  return (
    <NotificationPopup
      content={props.content}
      header={'Error'}
      onBackdropClick={close}
      isOpen={true}
      onEscapeKeyDown={close}
      aria-label={'error popup'}
    />
  );
};
