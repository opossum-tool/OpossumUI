// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import useEventCallback from '@mui/utils/useEventCallback';
import { memo } from 'react';

import type { PackageInfo } from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { isPackageAttributeIncomplete } from '../../../util/input-validation';
import type { Confirm } from '../../ConfirmationDialog/ConfirmationDialog';
import { TextBox } from '../../TextBox/TextBox';
import type { PackagePatch } from '../attribution-form.types';
import { attributionColumnClasses } from '../AttributionForm.style';

interface CopyrightSubPanelProps {
  packageInfo: PackageInfo;
  showHighlight?: boolean;
  onEdit?: Confirm;
  hidden?: boolean;
  onUpdate: (patch: PackagePatch) => void;
}

export function CopyrightSubPanel({
  packageInfo,
  onEdit,
  showHighlight,
  hidden,
  onUpdate,
}: CopyrightSubPanelProps) {
  const isIncomplete = isPackageAttributeIncomplete('copyright', packageInfo);
  const handleChange = useEventCallback(
    ({
      target: { value },
    }: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onEdit?.(() => onUpdate({ copyright: value })),
  );

  return hidden ? null : (
    <MuiBox sx={attributionColumnClasses.panel}>
      <CopyrightInput
        readOnly={!onEdit}
        text={packageInfo.copyright}
        showTooltip={!!showHighlight && isIncomplete}
        error={!!showHighlight && isIncomplete}
        handleChange={handleChange}
      />
    </MuiBox>
  );
}

const CopyrightInput = memo(
  ({
    text: copyright,
    readOnly,
    showTooltip,
    error,
    handleChange,
  }: {
    text?: string;
    readOnly: boolean;
    showTooltip: boolean;
    error: boolean;
    handleChange: React.ChangeEventHandler<
      HTMLInputElement | HTMLTextAreaElement
    >;
  }) => {
    return (
      <TextBox
        readOnly={readOnly}
        sx={attributionColumnClasses.textBox}
        title={'Copyright'}
        text={copyright}
        minRows={3}
        maxRows={5}
        tooltipProps={{
          placement: 'bottom',
          followCursor: true,
          title: text.generic.incomplete,
        }}
        showTooltip={showTooltip}
        multiline
        handleChange={handleChange}
        error={error}
      />
    );
  },
);
