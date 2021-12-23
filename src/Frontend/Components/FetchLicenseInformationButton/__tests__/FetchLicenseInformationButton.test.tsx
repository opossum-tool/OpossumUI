// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { render, screen } from '@testing-library/react';
import React, { ReactElement, ReactNode } from 'react';
import {
  FetchLicenseInformationButton,
  FetchStatus,
  useFetchPackageInfo,
} from '../FetchLicenseInformationButton';
import {
  createTestAppStore,
  renderComponentWithStore,
} from '../../../test-helpers/render-component-with-store';
import { PackageInfo } from '../../../../shared/shared-types';
import { Store } from 'redux';
import { Provider } from 'react-redux';
import { act, renderHook } from '@testing-library/react-hooks';
import { getTemporaryPackageInfo } from '../../../state/selectors/all-views-resource-selectors';
import '@testing-library/jest-dom/extend-expect';

describe('FetchLicenseInformationButton', () => {
  it('renders disabled button', () => {
    render(<FetchLicenseInformationButton isDisabled={true} url={''} />);
    expect(screen.getByLabelText('Fetch data')).toBeInTheDocument();
  });

  it('renders enabled button', () => {
    renderComponentWithStore(
      <FetchLicenseInformationButton
        url={'https://pypi.org/pypi/test'}
        isDisabled={false}
      />
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function mockConvertPayload(_: Response): Promise<PackageInfo> {
  return Promise.resolve({ licenseName: 'testLicense' });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function mockConvertPayloadRaises(_: Response): Promise<PackageInfo> {
  throw new Error('unexpected error');
}

const MOCK_URL = 'mock_url';

function getWrapper(store: Store, children: ReactNode): ReactElement {
  return <Provider store={store}>{children}</Provider>;
}

describe('useFetchPackageInfo', () => {
  // @ts-ignore
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => {
        Promise.resolve({});
      },
    })
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns idle', () => {
    const store = createTestAppStore();
    const { result } = renderHook(
      () =>
        useFetchPackageInfo({
          url: MOCK_URL,
          convertPayload: mockConvertPayload,
        }),
      {
        wrapper: ({ children }) => getWrapper(store, children),
      }
    );
    expect(result.current.fetchStatus).toBe(FetchStatus.Idle);
  });

  it('fetches data', async () => {
    const store = createTestAppStore();
    const { result } = renderHook(
      () =>
        useFetchPackageInfo({
          url: MOCK_URL,
          convertPayload: mockConvertPayload,
        }),
      {
        wrapper: ({ children }) => getWrapper(store, children),
      }
    );
    // eslint-disable-next-line @typescript-eslint/require-await
    await act(async () => {
      result.current.fetchData();
    });
    expect(result.current.fetchStatus).toBe(FetchStatus.Success);
    expect(getTemporaryPackageInfo(store.getState())).toMatchObject({
      licenseName: 'testLicense',
    });
  });

  it('handles errors', async () => {
    const store = createTestAppStore();
    const { result } = renderHook(
      () =>
        useFetchPackageInfo({
          url: MOCK_URL,
          convertPayload: mockConvertPayloadRaises,
        }),
      {
        wrapper: ({ children }) => getWrapper(store, children),
      }
    );
    // eslint-disable-next-line @typescript-eslint/require-await
    await act(async () => {
      result.current.fetchData();
    });
    expect(result.current.fetchStatus).toBe(FetchStatus.Error);
    expect(getTemporaryPackageInfo(store.getState())).toMatchObject({});
  });
});
