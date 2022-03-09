// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { fetchFromClearlyDefined } from '../fetch-from-clearly-defined';

describe('fetchFromClearlyDefined', () => {
  const axiosMock = new MockAdapter(axios);
  const testCoordinate = 'pypi/pypi/-/SQLAlchemy/1.4.14';
  const requestURL = `https://api.clearlydefined.io/definitions/${testCoordinate}`;

  it('parses payload correctly', async () => {
    axiosMock.onGet(requestURL).replyOnce(200, {
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
    });
  });

  it('reject in correct payload', async () => {
    axiosMock.onGet(requestURL).replyOnce(200, { someRandomField: 'value' });
    await expect(fetchFromClearlyDefined(testCoordinate)).rejects.toBeTruthy();
  });
});
