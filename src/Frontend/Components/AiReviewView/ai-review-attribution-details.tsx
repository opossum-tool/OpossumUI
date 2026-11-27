// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useAppSelector } from '../../state/hooks';
import {
  getSelectedAttributionId,
  getSelectedResourceId,
} from '../../state/selectors/resource-selectors';
import { AttributionDetails } from '../AttributionDetails/AttributionDetails';
import { AiReviewAttributionFormBody } from './ai-review-attribution-form-body';

export function AiReviewAttributionDetails() {
  const attributionId = useAppSelector(getSelectedAttributionId);
  const resourceId = useAppSelector(getSelectedResourceId);

  return (
    <AttributionDetails
      selection={{ attributionId, resourceId, isPending: false }}
      FormBody={AiReviewAttributionFormBody}
    />
  );
}
