// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useAppSelector } from '../../state/hooks';
import {
  getAttributionSelectionPendingResourceId,
  getSelectedAttributionId,
  getSelectedResourceId,
} from '../../state/selectors/resource-selectors';
import { AttributionDetails } from '../AttributionDetails/AttributionDetails';

export function AuditAttributionDetails() {
  const attributionId = useAppSelector(getSelectedAttributionId);
  const resourceId = useAppSelector(getSelectedResourceId);
  const pendingResourceId = useAppSelector(
    getAttributionSelectionPendingResourceId,
  );

  return (
    <AttributionDetails
      selection={{
        attributionId,
        resourceId,
        isPending: pendingResourceId === resourceId,
      }}
    />
  );
}
