#!/usr/bin/env bash

# SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
# SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
#
# SPDX-License-Identifier: Apache-2.0

NOTICE_HEADER="THE FOLLOWING SETS FORTH ATTRIBUTION NOTICES FOR THIRD PARTY SOFTWARE THAT MAY BE CONTAINED IN PORTIONS OF THE OPOSSUM UI PRODUCT."

grep -q "${NOTICE_HEADER}" ./notices/notices.txt || {
  echo "Error: Attributions not found in notices.txt"
  exit 1
}
grep -q "${NOTICE_HEADER}" ./notices/notices.html || {
  echo "Error: Attributions not found in notices.html"
  exit 1
}
