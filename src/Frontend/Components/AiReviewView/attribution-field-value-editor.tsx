// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import MuiBox from '@mui/material/Box';
import MuiButtonBase from '@mui/material/ButtonBase';
import MuiPopover from '@mui/material/Popover';
import MuiTypography from '@mui/material/Typography';
import { isEqual } from 'lodash-es';
import { type KeyboardEvent, useEffect, useId, useRef, useState } from 'react';

import type {
  AttributionFormBodyProps,
  PackagePatch,
} from '../AttributionForm/attribution-form.types';
import type { Confirm } from '../ConfirmationDialog/ConfirmationDialog';
import { aiReviewBodyClasses as classes } from './ai-review-attribution-form-body.style';
import { editorClasses } from './attribution-field-value-editor.style';
import {
  type ReviewFieldAttribute,
  ReviewFieldInput,
} from './review-field-input';

interface Props extends AttributionFormBodyProps {
  attribute: ReviewFieldAttribute;
  title: string;
  multiline?: boolean;
}

export function AttributionFieldValueEditor({
  multiline = false,
  ...props
}: Props) {
  const { attribute, title, packageInfo, onEdit } = props;
  const value = packageInfo[attribute] || '';
  const [keyboardActivation, setKeyboardActivation] = useState(false);
  const [editor, setEditor] = useState<{
    anchorEl: HTMLElement;
    restoreFocus: boolean;
  }>();
  const close = (restoreFocus = true) => {
    if (!restoreFocus) {
      setKeyboardActivation(false);
    }
    setEditor(undefined);
  };

  useEffect(() => {
    setEditor(undefined);
  }, [packageInfo.id, value]);

  if (!onEdit) {
    return (
      <MuiBox
        component="span"
        sx={multiline ? classes.detailValue : classes.summaryValue}
      >
        {value || '—'}
      </MuiBox>
    );
  }

  if (attribute === 'comment' && editor) {
    return (
      <FieldEditor {...props} onEdit={onEdit} {...editor} onClose={close} />
    );
  }

  return (
    <>
      <MuiButtonBase
        type="button"
        autoFocus={attribute === 'comment' && keyboardActivation}
        aria-label={`Edit ${title}`}
        sx={editorClasses.trigger}
        onClick={(event) => {
          event.stopPropagation();
          setKeyboardActivation(event.detail === 0);
          setEditor({
            anchorEl: event.currentTarget,
            restoreFocus: event.detail === 0,
          });
        }}
      >
        <MuiBox
          component="span"
          sx={[editorClasses.value, multiline ? editorClasses.multiline : {}]}
        >
          {value || '—'}
        </MuiBox>
        <EditOutlinedIcon fontSize="small" sx={editorClasses.editIcon} />
      </MuiButtonBase>
      {editor && (
        <FieldEditor {...props} onEdit={onEdit} {...editor} onClose={close} />
      )}
    </>
  );
}

// Mount the editing session only while open: display-only values do not need
// local drafts, input refs, or suggestion queries.
function FieldEditor({
  attribute,
  title,
  packageInfo,
  onUpdate,
  onEdit,
  anchorEl,
  restoreFocus,
  onClose,
}: Props & {
  onEdit: Confirm;
  anchorEl: HTMLElement;
  restoreFocus: boolean;
  onClose: (restoreFocus?: boolean) => void;
}) {
  const [pendingPatch, setPendingPatch] = useState<PackagePatch>({});
  const sessionActiveRef = useRef(true);
  const inputRef = useRef<HTMLElement | null>(null);
  const inputId = useId();
  const editedPackage = { ...packageInfo, ...pendingPatch };
  const setInputRef = (element: HTMLElement | null) => {
    inputRef.current = element;
  };
  const updateDraft = (patch: PackagePatch) =>
    setPendingPatch((current) => ({ ...current, ...patch }));

  useEffect(() => {
    sessionActiveRef.current = true;
    return () => {
      sessionActiveRef.current = false;
    };
  }, []);

  const commitPatch = (patch: PackagePatch, restoreFocus = true) => {
    if (!sessionActiveRef.current) {
      return;
    }
    void onEdit(() => {
      if (!sessionActiveRef.current) {
        return;
      }
      onUpdate({ ...pendingPatch, ...patch });
      onClose(restoreFocus);
    });
  };
  const commit = (restoreFocus = true) => {
    if (isEqual(editedPackage, packageInfo)) {
      onClose(restoreFocus);
    } else {
      commitPatch(pendingPatch, restoreFocus);
    }
  };

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
      return;
    }
    if (attribute === 'comment' && event.key === 'Tab') {
      return;
    }
    const suggestionsOpen =
      inputRef.current?.getAttribute('aria-expanded') === 'true';
    if (
      event.key === 'Tab' ||
      (event.key === 'Enter' &&
        ((attribute !== 'copyright' && attribute !== 'comment') ||
          event.ctrlKey ||
          event.metaKey) &&
        !event.nativeEvent.isComposing &&
        !suggestionsOpen)
    ) {
      event.preventDefault();
      event.stopPropagation();
      commit();
    }
  }

  const input = (
    <ReviewFieldInput
      id={inputId}
      inputRef={setInputRef}
      attribute={attribute}
      title={title}
      packageInfo={editedPackage}
      onUpdate={updateDraft}
      onCommit={commitPatch}
    />
  );

  if (attribute === 'comment') {
    return (
      <MuiBox
        onKeyDownCapture={handleKeyDown}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            commit(false);
          }
        }}
      >
        {input}
      </MuiBox>
    );
  }

  return (
    <MuiPopover
      open
      disableAutoFocus
      disableRestoreFocus={!restoreFocus}
      anchorEl={anchorEl}
      onClick={(event) => event.stopPropagation()}
      onKeyDownCapture={handleKeyDown}
      onClose={(_event, reason) =>
        reason === 'escapeKeyDown' ? onClose() : commit()
      }
      anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      slotProps={{
        backdrop: () => ({
          invisible: true,
          'data-testid': 'attribution-field-editor-backdrop',
        }),
        paper: { sx: editorClasses.panel },
        transition: { onEntered: () => inputRef.current?.focus() },
      }}
    >
      <MuiTypography
        component="label"
        htmlFor={inputId}
        variant="subtitle2"
        sx={{ display: 'block', mb: 2 }}
      >
        {title}
      </MuiTypography>
      {input}
    </MuiPopover>
  );
}
