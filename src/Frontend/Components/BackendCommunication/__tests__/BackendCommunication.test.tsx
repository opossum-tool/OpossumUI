// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { IpcChannel } from '../../../../shared/ipc-channels';
import {
  BackendCommunication,
  getBomAttributions,
} from '../BackendCommunication';
import { ExportType, Attributions } from '../../../../shared/shared-types';

describe('BackendCommunication', () => {
  test('renders an Open file icon', () => {
    renderComponentWithStore(<BackendCommunication />);
    expect(window.ipcRenderer.on).toHaveBeenCalledTimes(8);
    expect(window.ipcRenderer.on).toHaveBeenCalledWith(
      IpcChannel.FileLoaded,
      expect.anything()
    );
    expect(window.ipcRenderer.on).toHaveBeenCalledWith(
      IpcChannel.Logging,
      expect.anything()
    );
    expect(window.ipcRenderer.on).toHaveBeenCalledWith(
      IpcChannel.ResetLoadedFile,
      expect.anything()
    );
    expect(window.ipcRenderer.on).toHaveBeenCalledWith(
      IpcChannel.ExportFileRequest,
      expect.anything()
    );
    expect(window.ipcRenderer.on).toHaveBeenCalledWith(
      IpcChannel.ShowSearchPopup,
      expect.anything()
    );
    expect(window.ipcRenderer.on).toHaveBeenCalledWith(
      IpcChannel.ShowProjectMetadataPopup,
      expect.anything()
    );
    expect(window.ipcRenderer.on).toHaveBeenCalledWith(
      IpcChannel.SetBaseURLForRoot,
      expect.anything()
    );
    expect(window.ipcRenderer.on).toHaveBeenCalledWith(
      IpcChannel.ToggleHighlightForCriticalSignals,
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
