// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import CallMergeIcon from '@mui/icons-material/CallMerge';
import MuiIconButton from '@mui/material/IconButton';
import MuiTooltip from '@mui/material/Tooltip';
import { useIsMutating } from '@tanstack/react-query';

import { text } from '../../../../../shared/text';
import { setSelectedAttributionIdIfRemapped } from '../../../../state/actions/resource-actions/navigation-actions';
import { useAppDispatch, useAppSelector } from '../../../../state/hooks';
import {
  getIsPackageInfoDirty,
  getSelectedAttributionId,
  getSelectedResourceId,
} from '../../../../state/selectors/resource-selectors';
import { useAttributionIdsForReplacement } from '../../../../state/variables/use-attribution-ids-for-replacement';
import { backend } from '../../../../util/backendClient';
import { useIsSelectedResourceBreakpoint } from '../../../../util/use-selected-resource';
import { type PackagesPanelChildrenProps } from '../../PackagesPanel/PackagesPanel';

export const LinkButton: React.FC<PackagesPanelChildrenProps> = ({
  activeRelation,
  attributions,
  selectedAttributionIds,
  setMultiSelectedAttributionIds,
}) => {
  const dispatch = useAppDispatch();
  const [attributionIdsForReplacement] = useAttributionIdsForReplacement();
  const isPackageInfoModified = useAppSelector(getIsPackageInfoDirty);
  const isSelectedResourceBreakpoint = useIsSelectedResourceBreakpoint();
  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const selectedAttributionId = useAppSelector(getSelectedAttributionId);

  const createOrMatch = backend.createOrMatchAttributions.useMutation();
  const mutationsPending = useIsMutating() > 0;

  const handleLink = async () => {
    if (attributions) {
      const attributionsToLink = Object.fromEntries(
        selectedAttributionIds.map((attributionId) => [
          attributionId,
          attributions[attributionId],
        ]),
      );
      const result = await createOrMatch.mutateAsync({
        resourcePath: selectedResourceId,
        attributions: attributionsToLink,
      });
      dispatch(
        setSelectedAttributionIdIfRemapped(
          result.inputKeysToNewUuids,
          selectedAttributionId,
        ),
      );
    }
    setMultiSelectedAttributionIds([]);
  };

  return (
    <MuiIconButton
      aria-label={text.packageLists.linkAsAttribution}
      disabled={
        isSelectedResourceBreakpoint ||
        !selectedAttributionIds.length ||
        isPackageInfoModified ||
        activeRelation === 'resource' ||
        !!attributionIdsForReplacement.length ||
        mutationsPending
      }
      loading={createOrMatch.isPending}
      size={'small'}
      onClick={handleLink}
    >
      <MuiTooltip
        title={text.packageLists.linkAsAttribution}
        disableInteractive
        placement={'top'}
      >
        <CallMergeIcon />
      </MuiTooltip>
    </MuiIconButton>
  );
};
