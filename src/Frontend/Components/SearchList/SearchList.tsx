// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useHotkeys } from 'react-hotkeys-hook';
import { ListProps } from 'react-virtuoso';

import { useSearchRef } from '../SearchRefContext/SearchRefContext';
import { useVirtuosoComponent } from '../VirtuosoComponentContext/VirtuosoComponentContext';

export const SearchList: React.FC<ListProps> = (props) => {
  const searchRef = useSearchRef();
  const { isVirtuosoFocused } = useVirtuosoComponent();
  useHotkeys(
    'mod+f',
    () => searchRef?.current?.focus(),
    {
      enabled: isVirtuosoFocused,
    },
    [isVirtuosoFocused],
  );

  return <div {...props} />;
};
