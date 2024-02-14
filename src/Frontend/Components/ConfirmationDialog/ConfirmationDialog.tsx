// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

import { text } from '../../../shared/text';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';

export interface ConfirmOptions {
  onCancel?: () => unknown | Promise<unknown>;
  skip?: boolean;
}

export type Confirm = (
  onConfirm: () => unknown | Promise<unknown>,
  options?: ConfirmOptions,
) => Promise<boolean>;

/**
 * Hook to use the confirmation dialog.
 * @param options Options to be used for all confirm calls.
 * @returns A tuple containing a ref to the confirmation dialog and the confirm function.
 * @throws Error if the ref is not connected to a confirmation dialog.
 * @example
 * const [confirmRef, confirm] = useConfirmationDialog();
 * // ...
 * <button onClick={confirm(() => console.log('confirmed'))}>
 *    "Click to open confirmation dialog"
 * </button>
 * // ...
 * <ConfirmationDialog ref={confirmRef} title="Confirm" message="Are you sure?" />
 */
export function useConfirmationDialog(
  options?: ConfirmOptions,
): [React.RefObject<Confirm>, Confirm] {
  const confirmRef = useRef<Confirm>(null);

  const confirm = useCallback<Confirm>(
    (onConfirm, localOptions) => {
      if (!confirmRef.current) {
        throw new Error(
          'Confirmation dialog ref is not connected to a confirmation dialog.',
        );
      }

      return confirmRef.current(onConfirm, {
        onCancel: localOptions?.onCancel || options?.onCancel,
        skip: localOptions?.skip || options?.skip,
      });
    },
    [options?.onCancel, options?.skip],
  );

  return [confirmRef, confirm];
}

export interface ConfirmationDialogProps {
  title: string;
  message: React.ReactElement | string;
}

/**
 * A confirmation dialog that can be used with the useConfirmationDialog hook.
 * @param props The props for the confirmation dialog.
 * @returns A confirmation dialog.
 * @example
 * const [confirmRef, confirm] = useConfirmationDialog();
 * // ...
 * <button onClick={confirm(() => console.log('confirmed'))}>
 *    "Click to open confirmation dialog"
 * </button>
 * // ...
 * <ConfirmationDialog ref={confirmRef} title="Confirm" message="Are you sure?" />
 */
export const ConfirmationDialog = forwardRef<Confirm, ConfirmationDialogProps>(
  ({ message, title }, ref) => {
    const [open, setOpen] = useState(false);
    const resolveRef = useRef<(value: boolean) => void>();

    useImperativeHandle(
      ref,
      () =>
        async (onConfirm, { onCancel, skip } = {}) => {
          if (skip) {
            void onConfirm?.();
            return true;
          }

          setOpen(true);

          const result = await new Promise<boolean>((resolve) => {
            resolveRef.current = resolve;
          });

          if (result) {
            void onConfirm?.();
          } else {
            void onCancel?.();
          }

          setOpen(false);

          return result;
        },
      [],
    );

    return (
      <NotificationPopup
        content={message}
        header={title}
        isOpen={open}
        rightButtonConfig={{
          buttonText: text.buttons.cancel,
          color: 'secondary',
          onClick: () => resolveRef.current?.(false),
        }}
        centerLeftButtonConfig={{
          buttonText: text.buttons.ok,
          onClick: () => resolveRef.current?.(true),
        }}
        aria-label={'confirmation dialog'}
      />
    );
  },
);
