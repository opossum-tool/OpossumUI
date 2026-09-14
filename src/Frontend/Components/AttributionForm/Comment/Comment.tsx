// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import useEventCallback from '@mui/utils/useEventCallback';
import { memo } from 'react';

import type { PackageInfo } from '../../../../shared/shared-types';
import type { Confirm } from '../../ConfirmationDialog/ConfirmationDialog';
import { TextBox } from '../../TextBox/TextBox';
import type { PackagePatch } from '../attribution-form.types';
import { attributionColumnClasses } from '../AttributionForm.style';

interface Props {
  packageInfo: PackageInfo;
  onEdit?: Confirm;
  onUpdate: (patch: PackagePatch) => void;
}

export function Comment({ packageInfo, onEdit, onUpdate }: Props) {
  const handleChange = useEventCallback(
    ({
      target: { value },
    }: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onEdit?.(() => onUpdate({ comment: value })),
  );

  return (
    <MuiBox sx={attributionColumnClasses.panel}>
      <CommentInput
        text={packageInfo.comment}
        readOnly={!onEdit}
        handleChange={handleChange}
      />
    </MuiBox>
  );
}

const CommentInput = memo(
  ({
    text: comment,
    readOnly,
    handleChange,
  }: {
    text?: string;
    readOnly: boolean;
    handleChange: React.ChangeEventHandler<
      HTMLInputElement | HTMLTextAreaElement
    >;
  }) => (
    <TextBox
      readOnly={readOnly}
      title={'Comment'}
      text={comment}
      minRows={3}
      maxRows={5}
      multiline
      handleChange={handleChange}
    />
  ),
);
