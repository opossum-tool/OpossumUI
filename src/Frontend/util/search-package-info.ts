
// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { PackageInfoCore } from "../../shared/shared-types";

export function displayPackageInfoContainsSearchTerm(
    attribution: PackageInfoCore,
    searchTerm: string,
): boolean {
    return Boolean(
        attribution &&
        (searchTerm === '' ||
            (attribution.packageName &&
                attribution.packageName
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase())) ||
            (attribution.licenseName &&
                attribution.licenseName
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase())) ||
            (attribution.copyright &&
                attribution.copyright
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase())) ||
            (attribution.packageVersion &&
                attribution.packageVersion
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()))),
    );
}

export function licenseContainsSearchTerm(
    attribution: PackageInfoCore,
    searchTerm: string,
): boolean {
    return Boolean(attribution.licenseName && attribution.licenseName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()));
}
