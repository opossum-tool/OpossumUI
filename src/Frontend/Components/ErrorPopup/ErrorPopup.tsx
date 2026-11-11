// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useEffect } from 'react';

import { useCloseGlobalPopup } from '../GlobalPopup/popup-close-context';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';

const TIME_POPUP_IS_DISPLAYED = 1500;

interface ErrorPopupProps {
  content: string;
}

export const ErrorPopup: React.FC<ErrorPopupProps> = (props) => {
  const close = useCloseGlobalPopup();

  useEffect(() => {
    const timeout = setTimeout(close, TIME_POPUP_IS_DISPLAYED);
    return () => clearTimeout(timeout);
  }, [close]);

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
