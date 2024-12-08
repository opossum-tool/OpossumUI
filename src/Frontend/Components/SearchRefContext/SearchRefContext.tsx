// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { createContext, useContext } from 'react';

export const SearchRefContext =
  createContext<React.RefObject<HTMLInputElement | null> | null>(null);

export const useSearchRef = () => {
  return useContext(SearchRefContext);
};
