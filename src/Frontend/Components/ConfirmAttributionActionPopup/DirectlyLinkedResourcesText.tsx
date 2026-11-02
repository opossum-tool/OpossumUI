// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { DirectlyLinkedIcon } from '../Icons/Icons';

interface Props {
  count: number;
  noun: string;
}

export function DirectlyLinkedResourcesText({ count, noun }: Props) {
  return (
    <>
      {new Intl.NumberFormat().format(count)}{' '}
      <DirectlyLinkedIcon sx={{ verticalAlign: '-0.2em' }} />{' '}
      {count === 1 ? noun : `${noun}s`}:
    </>
  );
}
