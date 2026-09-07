// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { PlatformPath } from 'path';
import { vi } from 'vitest';

// importActual bypasses the 'path' mock, so this cannot recurse.
const posix = (await vi.importActual<PlatformPath>('path')).posix;

export const posixPathModule: PlatformPath & { default: PlatformPath } = {
  ...posix,
  default: posix,
};
