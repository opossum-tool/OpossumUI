@REM SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
@REM SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
@REM
@REM SPDX-License-Identifier: Apache-2.0

FOR /F "tokens=*" %%g IN ('call git describe --exact-match --tags --abbrev^=0') do (SET OPTION1=%%g)
FOR /F "tokens=*" %%g IN ('call git rev-parse --short HEAD') do (SET OPTION2=%%g)
if [%OPTION1%]==[] (echo {"commitInfo" : "%OPTION2%" } > "src\commitInfo.json") else (echo {"commitInfo" : "%OPTION1%" } > "src\commitInfo.json")

