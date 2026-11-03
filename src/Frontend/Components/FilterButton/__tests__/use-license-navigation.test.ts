// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, renderHook } from '@testing-library/react';

import { useLicenseNavigation } from '../use-license-navigation';

const rows = ['MIT', 'Apache-2.0', 'Zlib'].map((id) => ({ id, label: id }));

test.each([1, 2])(
  'removing active row %s selects the nearest remaining position',
  (activeIndex) => {
    const { result, rerender } = renderHook(useLicenseNavigation, {
      initialProps: rows,
    });
    act(() => result.current.activate(rows[activeIndex].id));

    rerender(rows.filter((_, index) => index !== activeIndex));

    expect(result.current.index).toBe(1);
    expect(result.current.current).toEqual(rows[activeIndex === 1 ? 2 : 1]);
  },
);

test('reordering follows the stored position', () => {
  const { result, rerender } = renderHook(useLicenseNavigation, {
    initialProps: rows,
  });
  act(() => result.current.activate(rows[2].id));

  rerender([rows[2], rows[0], rows[1]]);

  expect(result.current.current).toEqual(rows[1]);
  expect(result.current.index).toBe(2);
});

test.each([{ shortRows: [] }, { shortRows: [rows[0]] }])(
  'clamping a shortened list preserves the stored position for expansion: %j',
  ({ shortRows }) => {
    const { result, rerender } = renderHook(useLicenseNavigation, {
      initialProps: rows,
    });
    act(() => result.current.activate(rows[2].id));

    rerender(shortRows);
    expect(result.current.current).toEqual(shortRows[0]);
    expect(result.current.index).toBe(0);

    rerender(rows);
    expect(result.current.current).toEqual(rows[2]);
    expect(result.current.index).toBe(2);
  },
);

test('an initially empty list starts at the first row when populated', () => {
  const { result, rerender } = renderHook(useLicenseNavigation, {
    initialProps: rows.slice(0, 0),
  });
  expect(result.current.current).toBeUndefined();
  expect(result.current.index).toBe(0);
  act(() => result.current.move(2));

  rerender(rows);

  expect(result.current.current).toEqual(rows[0]);
  expect(result.current.index).toBe(0);
});

test.each([false, true])(
  'reset selects the first row when rows change: %s',
  (changeRows) => {
    const { result, rerender } = renderHook(useLicenseNavigation, {
      initialProps: rows,
    });
    act(() => result.current.activate(rows[1].id));

    act(() => {
      result.current.reset();
      if (changeRows) {
        rerender([rows[2], rows[1]]);
      }
    });

    expect(result.current.current).toEqual(rows[changeRows ? 2 : 0]);
    expect(result.current.index).toBe(0);
  },
);
