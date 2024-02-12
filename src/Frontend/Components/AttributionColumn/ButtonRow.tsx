// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import { useMemo, useState } from 'react';

import { PackageInfo } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { ButtonText } from '../../enums/enums';
import { EMPTY_DISPLAY_PACKAGE_INFO } from '../../shared-constants';
import { setTemporaryDisplayPackageInfo } from '../../state/actions/resource-actions/all-views-simple-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  getExternalAttributions,
  getIsGlobalSavingDisabled,
  getIsSavingDisabled,
  getManualDisplayPackageInfoOfSelected,
  wereTemporaryDisplayPackageInfoModified,
} from '../../state/selectors/all-views-resource-selectors';
import { Button, ButtonProps } from '../Button/Button';
import { DiffPopup } from '../DiffPopup/DiffPopup';
import { SplitButton } from '../SplitButton/SplitButton';

interface ButtonRowProps {
  areButtonsHidden?: boolean;
  packageInfo: PackageInfo;
  onSaveButtonClick?(): void;
  onSaveGloballyButtonClick?(): void;
  onDeleteButtonClick?(): void;
  onDeleteGloballyButtonClick?(): void;
  showSaveGloballyButton?: boolean;
  hideDeleteButtons?: boolean;
  additionalActions?: Array<ButtonProps>;
}

export function ButtonRow({
  packageInfo,
  areButtonsHidden,
  onDeleteButtonClick,
  onDeleteGloballyButtonClick,
  onSaveButtonClick,
  onSaveGloballyButtonClick,
  hideDeleteButtons,
  showSaveGloballyButton,
  additionalActions = [],
}: ButtonRowProps): React.ReactNode {
  const dispatch = useAppDispatch();
  const packageInfoWereModified = useAppSelector(
    wereTemporaryDisplayPackageInfoModified,
  );
  const initialManualDisplayPackageInfo = useAppSelector(
    getManualDisplayPackageInfoOfSelected,
  );
  const isSavingDisabled = useAppSelector(getIsSavingDisabled);
  const isGlobalSavingDisabled = useAppSelector(getIsGlobalSavingDisabled);
  const externalAttributions = useAppSelector(getExternalAttributions);
  const [isDiffPopupOpen, setIsDiffPopupOpen] = useState(false);

  const originalDisplayPackageInfo = useMemo(
    () =>
      !!packageInfo.originIds?.length
        ? Object.values(externalAttributions).find(({ originIds }) =>
            originIds?.some((id) => packageInfo.originIds?.includes(id)),
          )
        : undefined,
    [externalAttributions, packageInfo.originIds],
  );

  return (
    !areButtonsHidden && (
      <MuiBox
        sx={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'flex-end',
          flexWrap: 'wrap',
        }}
      >
        {renderSaveButton()}
        {renderDeleteButton()}
        {renderRevertButton()}
        {renderCompareButton()}
        {renderAdditionalActions()}
        {renderDiffPopup()}
      </MuiBox>
    )
  );

  function renderSaveButton() {
    return (
      <SplitButton
        minWidth={141}
        menuButtonProps={{ 'aria-label': 'save menu button' }}
        options={[
          {
            buttonText: packageInfo.preSelected
              ? ButtonText.Confirm
              : ButtonText.Save,
            disabled: isSavingDisabled,
            onClick: () => {
              onSaveButtonClick?.();
            },
            hidden: !onSaveButtonClick,
          },
          {
            buttonText: packageInfo.preSelected
              ? ButtonText.ConfirmGlobally
              : ButtonText.SaveGlobally,
            disabled: isGlobalSavingDisabled,
            onClick: () => {
              onSaveGloballyButtonClick?.();
            },
            hidden: !onSaveGloballyButtonClick || !showSaveGloballyButton,
          },
        ]}
      />
    );
  }

  function renderDeleteButton() {
    return (
      <SplitButton
        color={'secondary'}
        minWidth={130}
        menuButtonProps={{ 'aria-label': 'delete menu button' }}
        options={[
          {
            buttonText: ButtonText.Delete,
            onClick: () => onDeleteButtonClick?.(),
            hidden: !onDeleteButtonClick || hideDeleteButtons,
          },
          {
            buttonText: ButtonText.DeleteGlobally,
            onClick: () => onDeleteGloballyButtonClick?.(),
            hidden:
              !onDeleteGloballyButtonClick ||
              hideDeleteButtons ||
              !showSaveGloballyButton,
          },
        ]}
      />
    );
  }

  function renderRevertButton() {
    return (
      <Button
        color={'secondary'}
        buttonText={ButtonText.Revert}
        disabled={!packageInfoWereModified}
        onClick={() => {
          dispatch(
            setTemporaryDisplayPackageInfo(
              initialManualDisplayPackageInfo || EMPTY_DISPLAY_PACKAGE_INFO,
            ),
          );
        }}
      />
    );
  }

  function renderCompareButton() {
    return originalDisplayPackageInfo ? (
      <Button
        onClick={() => setIsDiffPopupOpen(true)}
        color={'secondary'}
        buttonText={text.buttons.compareToOriginal}
      />
    ) : null;
  }

  function renderAdditionalActions() {
    return additionalActions.map((action) => (
      <Button
        key={action.buttonText}
        color={action.color}
        buttonText={action.buttonText}
        onClick={action.onClick}
        disabled={action.disabled}
      />
    ));
  }

  function renderDiffPopup() {
    return originalDisplayPackageInfo ? (
      <DiffPopup
        original={originalDisplayPackageInfo}
        current={packageInfo}
        isOpen={isDiffPopupOpen}
        setOpen={setIsDiffPopupOpen}
        key={isDiffPopupOpen.toString()}
      />
    ) : null;
  }
}
