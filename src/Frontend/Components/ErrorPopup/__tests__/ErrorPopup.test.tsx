// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, screen } from '@testing-library/react';
import { StrictMode } from 'react';

import { PopupType } from '../../../enums/enums';
import {
  closePopup,
  openPopup,
} from '../../../state/actions/view-actions/view-actions';
import {
  getOpenPopup,
  getOpenPopups,
} from '../../../state/selectors/view-selector';
import { renderComponent } from '../../../test-helpers/render';
import { GlobalPopup } from '../../GlobalPopup/GlobalPopup';

const ERROR_POPUP_TIMEOUT = 1500;

describe('Error popup', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('automatically dismisses after the interval', async () => {
    const { store } = await renderComponent(<GlobalPopup />, {
      actions: [openPopup(PopupType.InvalidLinkPopup)],
    });

    expect(screen.getByText('Error')).toBeInTheDocument();
    await act(() => vi.advanceTimersByTime(ERROR_POPUP_TIMEOUT - 1));
    expect(getOpenPopup(store.getState())?.popup).toBe(
      PopupType.InvalidLinkPopup,
    );

    await act(() => vi.advanceTimersByTime(1));
    expect(getOpenPopup(store.getState())).toBeNull();
  });

  it('does not restart its interval when rerendered', async () => {
    const { rerender, store } = await renderComponent(<GlobalPopup />, {
      actions: [openPopup(PopupType.InvalidLinkPopup)],
    });

    await act(() => vi.advanceTimersByTime(ERROR_POPUP_TIMEOUT / 2));
    rerender(<GlobalPopup />);
    await act(() => vi.advanceTimersByTime(ERROR_POPUP_TIMEOUT / 2 - 1));
    expect(getOpenPopup(store.getState())?.popup).toBe(
      PopupType.InvalidLinkPopup,
    );
    await act(() => vi.advanceTimersByTime(1));
    expect(getOpenPopup(store.getState())).toBeNull();
  });

  it('cancels its interval when dismissed early', async () => {
    const { store } = await renderComponent(<GlobalPopup />, {
      actions: [openPopup(PopupType.InvalidLinkPopup)],
    });

    const [errorPopup] = getOpenPopups(store.getState());
    act(() => {
      store.dispatch(closePopup(errorPopup.id));
      store.dispatch(openPopup(PopupType.NotSavedPopup));
    });
    expect(getOpenPopup(store.getState())?.popup).toBe(PopupType.NotSavedPopup);

    await act(() => vi.advanceTimersByTime(ERROR_POPUP_TIMEOUT));
    expect(getOpenPopup(store.getState())?.popup).toBe(PopupType.NotSavedPopup);
  });

  it('dismisses only itself when covered by another popup', async () => {
    const { store } = await renderComponent(<GlobalPopup />, {
      actions: [openPopup(PopupType.InvalidLinkPopup)],
    });

    await act(() => vi.advanceTimersByTime(ERROR_POPUP_TIMEOUT / 2));
    act(() => {
      store.dispatch(openPopup(PopupType.NotSavedPopup));
    });
    expect(getOpenPopups(store.getState())).toHaveLength(2);

    await act(() => vi.advanceTimersByTime(ERROR_POPUP_TIMEOUT / 2));
    expect(getOpenPopups(store.getState())).toHaveLength(1);
    expect(getOpenPopup(store.getState())?.popup).toBe(PopupType.NotSavedPopup);
  });

  it('cleans up the interval correctly under Strict Mode', async () => {
    const { rerender, store } = await renderComponent(
      <StrictMode>
        <GlobalPopup />
      </StrictMode>,
      { actions: [openPopup(PopupType.InvalidLinkPopup)] },
    );

    await act(() => vi.advanceTimersByTime(ERROR_POPUP_TIMEOUT));
    expect(getOpenPopup(store.getState())).toBeNull();

    act(() => {
      store.dispatch(openPopup(PopupType.NotSavedPopup));
    });
    rerender(
      <StrictMode>
        <GlobalPopup />
      </StrictMode>,
    );
    await act(() => vi.advanceTimersByTime(ERROR_POPUP_TIMEOUT));
    expect(getOpenPopup(store.getState())?.popup).toBe(PopupType.NotSavedPopup);
  });
});
