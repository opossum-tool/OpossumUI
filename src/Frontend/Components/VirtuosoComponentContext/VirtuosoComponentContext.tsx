// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { createContext, use } from 'react';

export const VirtuosoComponentContext = createContext<{
  isVirtuosoFocused: boolean;
  loading: boolean | undefined;
}>({
  isVirtuosoFocused: false,
  loading: undefined,
});

export const useVirtuosoComponent = () => {
  return use(VirtuosoComponentContext);
};
