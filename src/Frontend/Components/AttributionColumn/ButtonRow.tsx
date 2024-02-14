// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useCallback, useMemo, useState } from 'react';

import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import { PackageInfo } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { EMPTY_DISPLAY_PACKAGE_INFO } from '../../shared-constants';
import { setTemporaryDisplayPackageInfo } from '../../state/actions/resource-actions/all-views-simple-actions';
import {
  addResolvedExternalAttributionAndSave,
  addToSelectedResource,
  removeResolvedExternalAttributionAndSave,
  savePackageInfo,
} from '../../state/actions/resource-actions/save-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  getExternalAttributions,
  getIsPackageInfoModified,
  getManualAttributionsToResources,
  getPackageInfoOfSelectedAttribution,
  getResolvedExternalAttributions,
  getSelectedResourceId,
} from '../../state/selectors/resource-selectors';
import { useAttributionIdsForReplacement } from '../../state/variables/use-attribution-ids-for-replacement';
import { useIpcRenderer } from '../../util/use-ipc-renderer';
import { Button } from '../Button/Button';
import { ConfirmDeletionPopup } from '../ConfirmDeletionPopup/ConfirmDeletionPopup';
import { ConfirmSavePopup } from '../ConfirmSavePopup/ConfirmSavePopup';
import { DiffPopup } from '../DiffPopup/DiffPopup';
import { ReplaceAttributionsPopup } from '../ReplaceAttributionsPopup/ReplaceAttributionsPopup';
import { Container } from './ButtonRow.style';

interface Props {
  packageInfo: PackageInfo;
  isEditable: boolean;
}

export function ButtonRow({ packageInfo, isEditable }: Props) {
  const dispatch = useAppDispatch();
  const isPackageInfoModified = useAppSelector(getIsPackageInfoModified);
  const initialPackageInfo = useAppSelector(
    getPackageInfoOfSelectedAttribution,
  );
  const resolvedExternalAttributions = useAppSelector(
    getResolvedExternalAttributions,
  );
  const externalAttributions = useAppSelector(getExternalAttributions);
  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const manualAttributionsToResources = useAppSelector(
    getManualAttributionsToResources,
  );

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

  const [attributionIdsForReplacement] = useAttributionIdsForReplacement();
  const [isConfirmDeletionPopupOpen, setIsConfirmDeletionPopupOpen] =
    useState(false);
  const [isReplaceAttributionsPopupOpen, setIsReplaceAttributionsPopupOpen] =
    useState(false);
  const [isConfirmSavePopupOpen, setIsConfirmSavePopupOpen] = useState(false);

  const selectedSignalIsResolved = resolvedExternalAttributions.has(
    packageInfo.id,
  );
  const hasMultipleResources =
    (manualAttributionsToResources[packageInfo.id]?.length ?? 0) > 1;
  const isSelectedResourceOnSelectedAttribution =
    manualAttributionsToResources[packageInfo.id]?.includes(selectedResourceId);

  const handleSave = useCallback(() => {
    hasMultipleResources
      ? setIsConfirmSavePopupOpen(true)
      : dispatch(
          savePackageInfo(selectedResourceId, packageInfo.id, packageInfo),
        );
  }, [hasMultipleResources, dispatch, selectedResourceId, packageInfo]);

  useIpcRenderer(AllowedFrontendChannels.SaveFileRequest, () => handleSave(), [
    handleSave,
  ]);

  if (attributionIdsForReplacement.includes(packageInfo.id)) {
    return null;
  }

  return (
    <Container>
      {attributionIdsForReplacement.length ? (
        renderReplaceButton()
      ) : (
        <>
          {renderSaveButton()}
          {renderLinkButton()}
          {renderCompareButton()}
          {renderDeleteButton()}
          {renderDeleteRestoreButton()}
          {renderRevertButton()}
        </>
      )}
    </Container>
  );

  function renderReplaceButton() {
    return (
      <>
        <Button
          buttonText={text.attributionColumn.replace}
          onClick={() => setIsReplaceAttributionsPopupOpen(true)}
          color={'success'}
        />
        <ReplaceAttributionsPopup
          selectedAttribution={packageInfo}
          open={isReplaceAttributionsPopupOpen}
          onClose={() => setIsReplaceAttributionsPopupOpen(false)}
        />
      </>
    );
  }

  function renderSaveButton() {
    if (!isEditable) {
      return null;
    }

    return (
      <>
        <Button
          buttonText={
            packageInfo.preSelected
              ? text.attributionColumn.confirm
              : text.attributionColumn.save
          }
          onClick={handleSave}
          disabled={!packageInfo.preSelected && !isPackageInfoModified}
        />
        <ConfirmSavePopup
          attributionIdsToSave={[packageInfo.id]}
          open={isConfirmSavePopupOpen}
          onClose={() => setIsConfirmSavePopupOpen(false)}
        />
      </>
    );
  }

  function renderLinkButton() {
    if (
      !initialPackageInfo ||
      !packageInfo.id ||
      (isEditable && isSelectedResourceOnSelectedAttribution)
    ) {
      return null;
    }

    return (
      <Button
        buttonText={text.attributionColumn.link}
        onClick={() => {
          dispatch(addToSelectedResource(initialPackageInfo));
        }}
        color={
          isPackageInfoModified || packageInfo.preSelected
            ? 'secondary'
            : 'primary'
        }
      />
    );
  }

  function renderDeleteButton() {
    if (!isEditable || !packageInfo.id) {
      return null;
    }

    return (
      <>
        <Button
          color={'secondary'}
          buttonText={text.attributionColumn.delete}
          onClick={() => setIsConfirmDeletionPopupOpen(true)}
        />
        <ConfirmDeletionPopup
          open={isConfirmDeletionPopupOpen}
          onClose={() => setIsConfirmDeletionPopupOpen(false)}
          attributionIdsToDelete={[packageInfo.id]}
        />
      </>
    );
  }

  function renderRevertButton() {
    if (!isEditable) {
      return null;
    }

    return (
      <Button
        color={'secondary'}
        buttonText={text.attributionColumn.revert}
        disabled={!isPackageInfoModified}
        onClick={() => {
          dispatch(
            setTemporaryDisplayPackageInfo(
              initialPackageInfo || EMPTY_DISPLAY_PACKAGE_INFO,
            ),
          );
        }}
      />
    );
  }

  function renderDeleteRestoreButton() {
    if (isEditable) {
      return null;
    }

    return (
      <Button
        color={'secondary'}
        buttonText={
          selectedSignalIsResolved
            ? text.attributionColumn.restore
            : text.attributionColumn.delete
        }
        onClick={() => {
          dispatch(
            selectedSignalIsResolved
              ? removeResolvedExternalAttributionAndSave([packageInfo.id])
              : addResolvedExternalAttributionAndSave([packageInfo.id]),
          );
        }}
      />
    );
  }

  function renderCompareButton() {
    if (!originalDisplayPackageInfo) {
      return null;
    }

    return (
      <>
        <Button
          onClick={() => setIsDiffPopupOpen(true)}
          color={'secondary'}
          buttonText={text.attributionColumn.compareToOriginal}
        />
        <DiffPopup
          original={originalDisplayPackageInfo}
          current={packageInfo}
          isOpen={isDiffPopupOpen}
          setOpen={setIsDiffPopupOpen}
          key={isDiffPopupOpen.toString()}
        />
      </>
    );
  }
}
