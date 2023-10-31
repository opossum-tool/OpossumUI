// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

import { fetchFromClearlyDefined } from '../fetch-from-clearly-defined';

describe('fetchFromClearlyDefined', () => {
  const axiosMock = new MockAdapter(axios);
  const testCoordinate = 'pypi/pypi/-/SQLAlchemy/1.4.14';
  const requestURL = `https://api.clearlydefined.io/definitions/${testCoordinate}`;

  it('parses payload correctly', async () => {
    const okStatus = 200;
    axiosMock.onGet(requestURL).replyOnce(okStatus, {
      licensed: {
        declared: 'MIT',
        facets: {
          core: {
            attribution: {
              parties: ['Copyright Jane Doe', 'Copyright John Doe'],
            },
          },
        },
      },
      coordinates: {
        type: 'pypi',
        provider: 'pypi',
        name: 'sqlalchemy',
        revision: '1.4.14',
      },
      described: {
        urls: {
          registry: 'https://pypi.org/project/SQLAlchemy',
          version: 'https://pypi.org/project/SQLAlchemy/1.4.14',
        },
      },
    });
    const packageInfo = await fetchFromClearlyDefined(testCoordinate);

    expect(packageInfo).toStrictEqual({
      packageName: 'sqlalchemy',
      packageVersion: '1.4.14',
      packageType: 'pypi',
      packageNamespace: undefined,
      copyright: 'Copyright Jane Doe\nCopyright John Doe',
      licenseName: 'MIT',
      url: 'https://pypi.org/project/SQLAlchemy/1.4.14',
      attributionIds: [],
    });
  });

  it('reject in correct payload', async () => {
    const okStatus = 200;
    axiosMock
      .onGet(requestURL)
      .replyOnce(okStatus, { someRandomField: 'value' });
    await expect(fetchFromClearlyDefined(testCoordinate)).rejects.toBeTruthy();
  });
});
