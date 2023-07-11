// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { Attributions } from '../../shared/shared-types';
import reduce from 'lodash/reduce';

export function getFilteredAttributionsById(
  ids: Array<string>,
  attributions: Attributions,
): Attributions {
  function reducer(
    filteredAttributions: Attributions,
    id: string,
  ): Attributions {
    filteredAttributions[id] = attributions[id];

    return filteredAttributions;
  }

  return reduce(ids, reducer, {});
}
