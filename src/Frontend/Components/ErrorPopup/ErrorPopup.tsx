// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useCallback, useEffect } from 'react';

import { closePopup } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch } from '../../state/hooks';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';

const TIME_POPUP_IS_DISPLAYED = 1500;

interface ErrorPopupProps {
  content: string;
}

export const ErrorPopup: React.FC<ErrorPopupProps> = (props) => {
  const dispatch = useAppDispatch();

  const close = useCallback((): void => {
    dispatch(closePopup());
  }, [dispatch]);

  useEffect(() => {
    const timeout = setTimeout(
      () => dispatch(closePopup()),
      TIME_POPUP_IS_DISPLAYED,
    );
    return () => clearTimeout(timeout);
  }, [dispatch]);

  return (
    <NotificationPopup
      header={'Error'}
      onBackdropClick={close}
      isOpen={true}
      onEscapeKeyDown={close}
      aria-label={'error popup'}
    >
      {props.content}
    </NotificationPopup>
  );
};
