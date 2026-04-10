// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useAppSelector } from '../state/hooks';
import { getSelectedResourceId } from '../state/selectors/resource-selectors';
import { backend } from './backendClient';

export function useIsSelectedResourceBreakpoint(): boolean {
  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const trimmedSelectedResourceId = selectedResourceId.replace(/\/$/, '');
  const { data: attributionBreakpoints } =
    backend.getAttributionBreakpoints.useQuery();
  return attributionBreakpoints?.has(trimmedSelectedResourceId) ?? false;
}
