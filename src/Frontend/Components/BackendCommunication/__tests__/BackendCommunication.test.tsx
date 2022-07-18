// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { AllowedFrontendChannels } from '../../../../shared/ipc-channels';
import {
  BackendCommunication,
  getBomAttributions,
} from '../BackendCommunication';
import { Attributions, ExportType } from '../../../../shared/shared-types';

describe('BackendCommunication', () => {
  test('renders an Open file icon', () => {
    renderComponentWithStore(<BackendCommunication />);
    expect(window.electronAPI.on).toHaveBeenCalledTimes(9);
    expect(window.electronAPI.on).toHaveBeenCalledWith(
      AllowedFrontendChannels.FileLoaded,
      expect.anything()
    );
    expect(window.electronAPI.on).toHaveBeenCalledWith(
      AllowedFrontendChannels.Logging,
      expect.anything()
    );
    expect(window.electronAPI.on).toHaveBeenCalledWith(
      AllowedFrontendChannels.ResetLoadedFile,
      expect.anything()
    );
    expect(window.electronAPI.on).toHaveBeenCalledWith(
      AllowedFrontendChannels.ExportFileRequest,
      expect.anything()
    );
    expect(window.electronAPI.on).toHaveBeenCalledWith(
      AllowedFrontendChannels.ShowSearchPopup,
      expect.anything()
    );
    expect(window.electronAPI.on).toHaveBeenCalledWith(
      AllowedFrontendChannels.ShowProjectMetadataPopup,
      expect.anything()
    );
    expect(window.electronAPI.on).toHaveBeenCalledWith(
      AllowedFrontendChannels.ShowProjectStatisticsPopup,
      expect.anything()
    );
    expect(window.electronAPI.on).toHaveBeenCalledWith(
      AllowedFrontendChannels.SetBaseURLForRoot,
      expect.anything()
    );
    expect(window.electronAPI.on).toHaveBeenCalledWith(
      AllowedFrontendChannels.ToggleHighlightForCriticalSignals,
      expect.anything()
    );
  });

  test('filters the correct BOM attributions', () => {
    const testAttributions: Attributions = {
      genericAttrib: {},
      firstPartyAttrib: { firstParty: true },
      followupAttrib: { followUp: 'FOLLOW_UP' },
      excludeAttrib: { excludeFromNotice: true },
      firstPartyExcludeAttrib: { firstParty: true, excludeFromNotice: true },
    };

    const detailedBomAttributions = getBomAttributions(
      testAttributions,
      ExportType.DetailedBom
    );
    expect(detailedBomAttributions).toEqual({
      genericAttrib: {},
      excludeAttrib: { excludeFromNotice: true },
    });

    const compactBomAttributions = getBomAttributions(
      testAttributions,
      ExportType.CompactBom
    );
    expect(compactBomAttributions).toEqual({
      genericAttrib: {},
    });

    const completeTestAttributions: Attributions = {
      completeAttrib: {
        attributionConfidence: 1,
        comment: 'Test',
        packageName: 'Test component',
        packageVersion: '',
        packageNamespace: 'org.apache.xmlgraphics',
        packageType: 'maven',
        packagePURLAppendix:
          '?repository_url=repo.spring.io/release#everybody/loves/dogs',
        url: '',
        copyright: '(c) John Doe',
        licenseName: '',
        licenseText: 'Permission is hereby granted, free of charge, to...',
        originId: '',
        preSelected: true,
      },
    };

    const compactBomCompleteAttributions = getBomAttributions(
      completeTestAttributions,
      ExportType.CompactBom
    );
    expect(compactBomCompleteAttributions).toEqual(completeTestAttributions);

    const detailedBomCompleteAttributions = getBomAttributions(
      completeTestAttributions,
      ExportType.DetailedBom
    );
    expect(detailedBomCompleteAttributions).toEqual(completeTestAttributions);
  });
});
