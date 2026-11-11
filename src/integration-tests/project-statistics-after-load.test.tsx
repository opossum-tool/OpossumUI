// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act } from '@testing-library/react';

import { getParsedInputFileEnrichedWithTestData } from '../Frontend/test-helpers/general-test-helpers';
import { AllowedFrontendChannels } from '../shared/ipc-channels';
import { text } from '../shared/text';
import { renderApp } from '../testing/render-app';
import { clickPopupButton, expectPopupHidden, getPopup } from '../testing/ui';

describe('automatic project statistics after load', () => {
  it('waits for notes to close after a successful load', async () => {
    const { sendToChannel } = await renderApp({
      data: getParsedInputFileEnrichedWithTestData({}),
      userSettings: { showProjectStatistics: true },
    });

    act(() => sendToChannel(AllowedFrontendChannels.ShowWhatsNew));
    await getPopup(text.whatsNew.title);
    act(() => sendToChannel(AllowedFrontendChannels.ProjectOpened));

    await expectPopupHidden('project statistics');
    await clickPopupButton(text.whatsNew.title, text.buttons.close);
    await getPopup('project statistics');
    await clickPopupButton('project statistics', text.buttons.close);
    await expectPopupHidden('project statistics');
  });
});
