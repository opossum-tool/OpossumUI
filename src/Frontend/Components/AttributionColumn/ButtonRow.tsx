// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';

import { DisplayPackageInfo } from '../../../shared/shared-types';
import { ButtonText, PopupType, View } from '../../enums/enums';
import { EMPTY_DISPLAY_PACKAGE_INFO } from '../../shared-constants';
import { setTemporaryDisplayPackageInfo } from '../../state/actions/resource-actions/all-views-simple-actions';
import { setAttributionIdMarkedForReplacement } from '../../state/actions/resource-actions/attribution-view-simple-actions';
import { openPopup } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  getAttributionIdMarkedForReplacement,
  getDisplayedPackage,
  getIsGlobalSavingDisabled,
  getIsSavingDisabled,
  getManualDisplayPackageInfoOfSelected,
  getSelectedAttributionIdInAttributionView,
  wereTemporaryDisplayPackageInfoModified,
} from '../../state/selectors/all-views-resource-selectors';
import { getSelectedView } from '../../state/selectors/view-selector';
import { Button, ButtonProps } from '../Button/Button';
import { MenuButton } from '../MenuButton/MenuButton';
import { SplitButton } from '../SplitButton/SplitButton';
import { getSelectedManualAttributionIdForAuditView } from './attribution-column-helpers';

interface ButtonRowProps {
  areButtonsHidden?: boolean;
  displayPackageInfo: DisplayPackageInfo;
  onSaveButtonClick?(): void;
  onSaveGloballyButtonClick?(): void;
  onDeleteButtonClick?(): void;
  onDeleteGloballyButtonClick?(): void;
  showSaveGloballyButton?: boolean;
  hideDeleteButtons?: boolean;
  additionalActions?: Array<ButtonProps>;
}

export function ButtonRow({
  displayPackageInfo,
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
  const attributionIdMarkedForReplacement = useAppSelector(
    getAttributionIdMarkedForReplacement,
  );
  const selectedPackage = useAppSelector(getDisplayedPackage);
  const view = useAppSelector(getSelectedView);
  const selectedAttributionIdInAttributionView = useAppSelector(
    getSelectedAttributionIdInAttributionView,
  );
  const packageInfoWereModified = useAppSelector(
    wereTemporaryDisplayPackageInfoModified,
  );
  const initialManualDisplayPackageInfo =
    useAppSelector(getManualDisplayPackageInfoOfSelected) ||
    EMPTY_DISPLAY_PACKAGE_INFO;
  const isSavingDisabled = useAppSelector(getIsSavingDisabled);
  const isGlobalSavingDisabled = useAppSelector(getIsGlobalSavingDisabled);

  const selectedAttributionId =
    view === View.Attribution
      ? selectedAttributionIdInAttributionView
      : getSelectedManualAttributionIdForAuditView(selectedPackage);

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
        {renderReplaceButton()}
        {renderRevertButton()}
        {renderAdditionalActions()}
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
            buttonText: displayPackageInfo.preSelected
              ? ButtonText.Confirm
              : ButtonText.Save,
            disabled: isSavingDisabled,
            onClick: () => {
              onSaveButtonClick?.();
            },
            hidden: !onSaveButtonClick,
          },
          {
            buttonText: displayPackageInfo.preSelected
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
        color={'error'}
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

  function renderReplaceButton() {
    if (!selectedAttributionId) {
      return null;
    }

    return (
      <MenuButton
        title={ButtonText.Replace}
        color={'secondary'}
        options={[
          {
            buttonText: ButtonText.ReplaceMarked,
            onClick: () => {
              dispatch(
                openPopup(
                  PopupType.ReplaceAttributionPopup,
                  selectedAttributionId,
                ),
              );
            },
            disabled:
              displayPackageInfo.preSelected ||
              packageInfoWereModified ||
              !attributionIdMarkedForReplacement ||
              selectedAttributionId === attributionIdMarkedForReplacement,
          },
          {
            buttonText: ButtonText.MarkForReplacement,
            onClick: () => {
              dispatch(
                setAttributionIdMarkedForReplacement(selectedAttributionId),
              );
            },
            disabled:
              selectedAttributionId === attributionIdMarkedForReplacement,
          },
          {
            buttonText: ButtonText.UnmarkForReplacement,
            onClick: () => {
              dispatch(setAttributionIdMarkedForReplacement(''));
            },
            disabled:
              selectedAttributionId !== attributionIdMarkedForReplacement,
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
            setTemporaryDisplayPackageInfo(initialManualDisplayPackageInfo),
          );
        }}
      />
    );
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
}
