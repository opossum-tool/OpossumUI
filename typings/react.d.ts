// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ReactNode, Ref, RefAttributes } from 'react';

declare module 'react' {
  // Overwrite type definition of forwardRef to allow forwarding generic components.
  // See https://fettblog.eu/typescript-react-generic-forward-refs/
  function forwardRef<T, P>(
    render: (props: P, ref: Ref<T>) => React.ReactElement<unknown> | null,
  ): (props: P & RefAttributes<T>) => React.ReactElement<unknown> | null;
}
