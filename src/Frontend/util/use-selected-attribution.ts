// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useAppSelector } from '../state/hooks';
import { getSelectedAttributionId } from '../state/selectors/resource-selectors';
import { backend } from './backendClient';

export function useSelectedAttribution() {
  const selectedAttributionId = useAppSelector(getSelectedAttributionId);

  const selectedAttributionData = backend.getAttributionData.useQuery(
    {
      attributionUuid: selectedAttributionId,
    },
    { enabled: !!selectedAttributionId },
  );

  if (!selectedAttributionId) {
    return null;
  }

  return selectedAttributionData.data;
}
