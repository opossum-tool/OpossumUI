// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { _getAttributionPropertyDisplayNameFromId } from '../AttributionPropertyCountTable';

describe('getAttributionPropertyDisplayNameFromId', () => {
  it('gets valid property display name from property id', () => {
    const expectedDisplayName = 'First party';
    const propertyID = 'firstParty';

    const attributionPropertyDisplayName =
      _getAttributionPropertyDisplayNameFromId(propertyID);

    expect(attributionPropertyDisplayName).toEqual(expectedDisplayName);
  });

  it('gets invalid display name as it is', () => {
    const expectedDisplayName = 'random';
    const propertyID = 'random';

    const attributionPropertyDisplayName =
      _getAttributionPropertyDisplayNameFromId(propertyID);

    expect(attributionPropertyDisplayName).toEqual(expectedDisplayName);
  });
});
