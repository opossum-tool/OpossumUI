// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

type RelationshipType =
  | 'DEPENDENCY_OF'
  | 'DESCRIBES'
  | 'DESCRIBED_BY'
  | 'CONTAINS'
  | 'CONTAINED_BY'
  | 'DEPENDS_ON'
  | 'DEPENDENCY_MANIFEST_OF'
  | 'BUILD_DEPENDENCY_OF'
  | 'DEV_DEPENDENCY_OF'
  | 'OPTIONAL_DEPENDENCY_OF'
  | 'PROVIDED_DEPENDENCY_OF'
  | 'TEST_DEPENDENCY_OF'
  | 'RUNTIME_DEPENDENCY_OF'
  | 'EXAMPLE_OF'
  | 'GENERATES'
  | 'GENERATED_FROM'
  | 'ANCESTOR_OF'
  | 'DESCENDANT_OF'
  | 'VARIANT_OF'
  | 'DISTRIBUTION_ARTIFACT'
  | 'PATCH_FOR'
  | 'PATCH_APPLIED'
  | 'COPY_OF'
  | 'FILE_ADDED'
  | 'FILE_DELETED'
  | 'FILE_MODIFIED'
  | 'EXPANDED_FROM_ARCHIVE'
  | 'DYNAMIC_LINK'
  | 'STATIC_LINK'
  | 'DATA_FILE_OF'
  | 'TEST_CASE_OF'
  | 'BUILD_TOOL_OF'
  | 'DEV_TOOL_OF'
  | 'TEST_OF'
  | 'TEST_TOOL_OF'
  | 'DOCUMENTATION_OF'
  | 'OPTIONAL_COMPONENT_OF'
  | 'METAFILE_OF'
  | 'PACKAGE_OF'
  | 'AMENDS'
  | 'PREREQUISITE_FOR'
  | 'HAS_PREREQUISITE'
  | 'OTHER';

type SpdxValue<value> = 'NONE' | 'NOASSERTION' | value;

export interface SpdxDocument extends SpdxAttributions {
  SPDXID: string;
  spdxVersion: string;
  creationInfo: {
    created: string;
    creators: Array<string>;
  };
  documentDescribes: Array<string>;
  dataLicense: string;
  name?: string;
  documentNamespace: string;
}

export interface SpdxAttributions {
  hasExtractedLicensingInfos: Array<SpdxLicenseInfo>;
  packages: Array<SpdxPackage>;
  relationships: Array<SpdxExternalRelationship>;
}

export interface SpdxLicenseInfo {
  licenseId: string;
  extractedText: SpdxValue<string>;
  name: SpdxValue<string>;
}

export interface SpdxPackage {
  SPDXID: string;
  name: SpdxValue<string>;
  versionInfo: SpdxValue<string>;
  licenseConcluded: SpdxValue<string>;
  licenseDeclared: SpdxValue<string>;
  copyrightText: SpdxValue<string>;
  comment?: SpdxValue<string>;
  licenseInfoFromFiles: SpdxValue<Array<string>>;
  downloadLocation: SpdxValue<string>;
  homepage?: string;
  externalRefs: Array<SpdxExternalRef>;
  filesAnalyzed: boolean;
}

export interface SpdxExternalRelationship {
  spdxElementId: string;
  relatedSpdxElement: string;
  relationshipType: RelationshipType;
}

export interface SpdxExternalRef {
  referenceCategory: 'PACKAGE_MANAGER';
  referenceLocator: SpdxValue<string>;
  referenceType: 'purl';
}

export interface Package {
  copyright?: string;
  license?: string;
  licenseText?: string;
  url?: string;
  name?: string;
  version?: string;
  namespace?: string;
  type?: string;
  appendix?: string;
  dependencies: Array<Package>;
  comment?: string;
}
