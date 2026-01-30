@echo off
REM SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
REM SPDX-FileCopyrightText: TNG Technology Consulting GmbH<https://www.tngtech.com>
REM
REM SPDX-License-Identifier: Apache-2.0

REM This script is used to start the app with vite. To be able to directly open an .opossum file when starting the app
REM we need to set the environment variable OPOSSUM_FILE. Arguments appended to yarn commands are only appended at
REM the end, thus we need this script to set the environment variable properly.

SET FILE_PATH=%1

if defined FILE_PATH (
echo File path provided: %FILE_PATH%
)

yarn generate-notice && cross-env OPOSSUM_FILE=%FILE_PATH% yarn vite
