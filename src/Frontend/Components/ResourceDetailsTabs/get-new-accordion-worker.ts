// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

export function getNewAccordionWorker(): Worker {
  return new Worker(new URL('./accordion-worker', import.meta.url));
}
