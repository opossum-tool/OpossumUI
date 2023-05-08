// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React, { ReactElement, ReactNode } from 'react';
import {
  FETCH_DATA_BUTTON_DISABLED_TOOLTIP,
  FETCH_DATA_TOOLTIP,
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
import { getTemporaryDisplayPackageInfo } from '../../../state/selectors/all-views-resource-selectors';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { convertGithubPayload } from '../github-fetching-helpers';

const axiosMock = new MockAdapter(axios);

describe('FetchLicenseInformationButton', () => {
  it('renders disabled button', () => {
    render(<FetchLicenseInformationButton disabled={true} url={''} />);
    expect(
      screen.getByLabelText(FETCH_DATA_BUTTON_DISABLED_TOOLTIP)
    ).toBeInTheDocument();
  });

  it('renders enabled button', () => {
    renderComponentWithStore(
      <FetchLicenseInformationButton
        url={'https://pypi.org/pypi/pip'}
        disabled={false}
      />
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  describe('Tooltip', () => {
    it("shows fetching error 'Network error'", () => {
      const MOCK_URL = 'https://pypi.org/pypi/test';

      axiosMock.onGet(MOCK_URL).networkErrorOnce();

      renderComponentWithStore(
        <FetchLicenseInformationButton url={MOCK_URL} disabled={false} />
      );

      fireEvent.click(screen.getByRole('button'));

      expect(
        waitFor(() => {
          screen.getByLabelText('Network Error');
        })
      ).resolves.toBeInTheDocument();
    });

    it("shows fetching error 'Request failed with status code 404'", () => {
      const MOCK_URL = 'https://github.com/opossum-tool/Oposs';
      const notFoundStatus = 404;

      axiosMock.onGet(MOCK_URL).replyOnce(notFoundStatus, {});

      renderComponentWithStore(
        <FetchLicenseInformationButton url={MOCK_URL} disabled={false} />
      );

      fireEvent.click(screen.getByRole('button'));

      expect(
        waitFor(() => {
          screen.getByLabelText('Request failed with status code 404');
        })
      ).resolves.toBeInTheDocument();
    });

    it('shows fetch data tooltip after successful fetch', () => {
      const MOCK_URL = 'https://pypi.org/project/pip';
      const okStatus = 200;

      axiosMock.onGet(MOCK_URL).replyOnce(okStatus, {
        license: { spdx_id: 'Apache-2.0' },
        content: 'TGljZW5zZSBUZXh0', // "License Text" in base64
        html_url: 'https://github.com/opossum-tool/OpossumUI/blob/main/LICENSE',
      });

      renderComponentWithStore(
        <FetchLicenseInformationButton url={MOCK_URL} disabled={false} />
      );

      fireEvent.click(screen.getByRole('button'));

      expect(
        waitFor(() => {
          screen.getByLabelText(FETCH_DATA_TOOLTIP);
        })
      ).resolves.toBeInTheDocument();
    });
  });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function mockConvertPayload(_: Response): PackageInfo {
  return { licenseName: 'testLicense' };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function mockConvertPayloadRaises(_: Response): PackageInfo {
  throw new Error('unexpected error');
}

const MOCK_URL = 'mock_url';

function getWrapper(store: Store, children: ReactNode): ReactElement {
  return <Provider store={store}>{children}</Provider>;
}

const GITHUB_URL = 'https://github.com/opossum-tool/OpossumUI';

describe('useFetchPackageInfo', () => {
  it('returns idle', () => {
    const store = createTestAppStore();
    const wrapper = ({ children }: { children: ReactNode }): ReactElement =>
      getWrapper(store, children);

    const { result } = renderHook(
      () =>
        useFetchPackageInfo({
          url: MOCK_URL,
          convertPayload: mockConvertPayload,
        }),
      {
        wrapper,
      }
    );
    expect(result.current.fetchStatus).toBe(FetchStatus.Idle);
  });

  it('fetches data', async () => {
    const okStatus = 200;
    axiosMock.onGet(GITHUB_URL).replyOnce(okStatus, {
      license: { spdx_id: 'Apache-2.0' },
      content: 'TGljZW5zZSBUZXh0', // "License Text" in base64
      html_url: 'https://github.com/opossum-tool/OpossumUI/blob/main/LICENSE',
    });

    const licenseFetchingInformation = {
      url: GITHUB_URL,
      convertPayload: convertGithubPayload,
    };

    const store = createTestAppStore();
    const wrapper = ({ children }: { children: ReactNode }): ReactElement =>
      getWrapper(store, children);
    const { result } = renderHook(
      () => useFetchPackageInfo(licenseFetchingInformation),
      { wrapper }
    );
    await act(async () => {
      await result.current.fetchData();
    });

    expect(result.current.fetchStatus).toBe(FetchStatus.Success);
    expect(getTemporaryDisplayPackageInfo(store.getState())).toMatchObject({
      licenseName: 'Apache-2.0',
    });
  });

  it('handles errors', async () => {
    const store = createTestAppStore();
    const wrapper = ({ children }: { children: ReactNode }): ReactElement =>
      getWrapper(store, children);
    const { result } = renderHook(
      () =>
        useFetchPackageInfo({
          url: MOCK_URL,
          convertPayload: mockConvertPayloadRaises,
        }),
      {
        wrapper,
      }
    );
    await act(async () => {
      await result.current.fetchData();
    });
    expect(result.current.fetchStatus).toBe(FetchStatus.Error);
    expect(getTemporaryDisplayPackageInfo(store.getState())).toMatchObject({});
  });
});
