// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import isEqual from 'lodash/isEqual';

import { getComparableAttributes } from './get-comparable-attributes';
import { PackageInfo } from './shared-types';

export type ModifiedPreferredState = {
  modifiedPreferred?: boolean;
  wasPreferred?: boolean;
};

export function getModifiedPreferredState({
  attribution,
  externalAttributionsList,
}: {
  attribution: PackageInfo;
  externalAttributionsList: Array<PackageInfo>;
}): ModifiedPreferredState | undefined {
  const originalPreferred =
    !!attribution.originIds?.length && !attribution.wasPreferred
      ? externalAttributionsList.find(
          (candidate) =>
            candidate.wasPreferred &&
            candidate.originIds?.some((id) =>
              attribution.originIds?.includes(id),
            ),
        )
      : undefined;
  switch (
    originalPreferred &&
    !isEqual(
      getComparableAttributes(originalPreferred),
      getComparableAttributes(attribution),
    )
  ) {
    case true:
      return {
        modifiedPreferred: true,
        wasPreferred: undefined,
      };
    case false:
      return {
        modifiedPreferred: undefined,
        wasPreferred: true,
      };
    case undefined:
      return undefined;
  }
}
