// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useMemo } from 'react';

import { text } from '../../../../shared/text';
import { OpossumColors } from '../../../shared-styles';
import { useAppSelector } from '../../../state/hooks';
import { getSelectedResourceId } from '../../../state/selectors/resource-selectors';
import { useManualAttributionFilters } from '../../../state/variables/use-filters';
import { usePickerMode } from '../../../state/variables/use-picker-mode';
import { backend } from '../../../util/backendClient';
import { attributionFilterOptions } from '../attribution-filter-options';
import { type Alert, PackagesPanel } from '../PackagesPanel/PackagesPanel';
import { AttributionsList } from './AttributionsList/AttributionsList';
import { ConfirmButton } from './ConfirmButton/ConfirmButton';
import { CreateButton } from './CreateButton/CreateButton';
import { DeleteButton } from './DeleteButton/DeleteButton';
import { LinkButton } from './LinkButton/LinkButton';
import { MoreActionsButton } from './MoreActionsButton/MoreActionsButton';
import { ReplaceButton } from './ReplaceButton/ReplaceButton';

export function AttributionsPanel() {
  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const hasIncompleteAttributions =
    backend.resourceHasIncompleteManualAttributions.useQuery({
      resourcePath: selectedResourceId,
    });

  const pickerMode = usePickerMode();
  const isReplacementMode = pickerMode.mode === 'replace';
  const isCompareMode = pickerMode.mode === 'compare';

  const alert = useMemo<Alert | undefined>(() => {
    if (isReplacementMode) {
      return {
        text: text.packageLists.selectReplacement,
        color: OpossumColors.green,
      };
    }
    if (isCompareMode) {
      return {
        text: text.packageLists.selectComparisonAttribution,
        color: OpossumColors.green,
      };
    }
    if (hasIncompleteAttributions.data) {
      return {
        text: text.packageLists.incompleteAttributions,
        color: OpossumColors.lightOrange,
        textColor: OpossumColors.black,
      };
    }

    return undefined;
  }, [isCompareMode, isReplacementMode, hasIncompleteAttributions.data]);

  return (
    <PackagesPanel
      external={false}
      alert={alert}
      filterOptions={attributionFilterOptions}
      renderActions={(props) => (
        <>
          <CreateButton {...props} />
          <LinkButton {...props} />
          <ConfirmButton {...props} />
          <ReplaceButton {...props} />
          <DeleteButton {...props} />
          <MoreActionsButton {...props} />
        </>
      )}
      useAttributionFilters={useManualAttributionFilters}
      testId={'attributions-panel'}
    >
      {(props) => <AttributionsList {...props} />}
    </PackagesPanel>
  );
}
