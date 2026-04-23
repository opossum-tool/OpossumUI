// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import CallMergeIcon from '@mui/icons-material/CallMerge';
import MuiIconButton from '@mui/material/IconButton';
import MuiTooltip from '@mui/material/Tooltip';
import { useIsMutating } from '@tanstack/react-query';

import { text } from '../../../../../shared/text';
import { setSelectedAttributionId } from '../../../../state/actions/resource-actions/audit-view-simple-actions';
import { useAppDispatch, useAppSelector } from '../../../../state/hooks';
import {
  getSelectedAttributionId,
  getSelectedResourceId,
} from '../../../../state/selectors/resource-selectors';
import { backend } from '../../../../util/backendClient';
import { useIsSelectedResourceBreakpoint } from '../../../../util/use-selected-resource';
import { type PackagesPanelChildrenProps } from '../../PackagesPanel/PackagesPanel';

export const LinkButton: React.FC<PackagesPanelChildrenProps> = ({
  attributions,
  selectedAttributionIds,
  setMultiSelectedAttributionIds,
}) => {
  const dispatch = useAppDispatch();

  const isSelectedResourceBreakpoint = useIsSelectedResourceBreakpoint();
  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const selectedAttributionId = useAppSelector(getSelectedAttributionId);

  const createOrMatch = backend.createOrMatchAttributions.useMutation({
    scope: { id: 'signalsPanel' },
  });
  const mutationsPending = useIsMutating() > 0;

  const handleLink = async () => {
    if (attributions) {
      const attributionsToLink = Object.fromEntries(
        Object.entries(attributions).filter(([attributionId]) =>
          selectedAttributionIds.includes(attributionId),
        ),
      );
      const result = await createOrMatch.mutateAsync({
        resourcePath: selectedResourceId,
        attributions: attributionsToLink,
      });
      if (result.attribution[selectedAttributionId]) {
        dispatch(
          setSelectedAttributionId(result.attribution[selectedAttributionId]),
        );
      }
    }
    setMultiSelectedAttributionIds([]);
  };

  return (
    <MuiIconButton
      aria-label={text.packageLists.linkAsAttribution}
      disabled={
        isSelectedResourceBreakpoint ||
        !selectedAttributionIds.length ||
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
