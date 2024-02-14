// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useUserSetting } from './use-user-setting';

export const usePanelSizes = () => {
  const [resourceBrowserWidth, setResourceBrowserWidth] = useUserSetting({
    defaultValue: 340,
    key: 'resourceBrowserWidth',
  });
  const [packageListsWidth, setPackageListsWidth] = useUserSetting({
    defaultValue: 340,
    key: 'packageListsWidth',
  });
  const [linkedResourcesPanelHeight, setLinkedResourcesPanelHeight] =
    useUserSetting({
      defaultValue: 340,
      key: 'linkedResourcesPanelHeight',
    });
  const [signalsPanelHeight, setSignalsPanelHeight] = useUserSetting({
    defaultValue: 340,
    key: 'signalsPanelHeight',
  });

  return {
    resourceBrowserWidth,
    setResourceBrowserWidth,
    packageListsWidth,
    setPackageListsWidth,
    linkedResourcesPanelHeight,
    setLinkedResourcesPanelHeight,
    signalsPanelHeight,
    setSignalsPanelHeight,
  };
};
