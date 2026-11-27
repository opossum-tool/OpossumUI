// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

export const AI_REVIEW_FILTERS = [
  'all',
  'deferred',
  'needsFollowUp',
  'humanModified',
  'fullyResolved',
] as const;

export type AiReviewFilter = (typeof AI_REVIEW_FILTERS)[number];

export type AiReviewCounts = Record<AiReviewFilter, number>;
