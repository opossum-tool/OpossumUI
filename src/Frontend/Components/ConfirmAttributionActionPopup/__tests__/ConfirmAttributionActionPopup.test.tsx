// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import { noop } from 'lodash-es';

import { renderComponent } from '../../../test-helpers/render';
import { ConfirmAttributionActionPopup } from '../ConfirmAttributionActionPopup';

describe('ConfirmAttributionActionPopup', () => {
  it('keeps a pending local action visible when availability is lost', async () => {
    await renderComponent(
      <ConfirmAttributionActionPopup
        open
        onClose={noop}
        header={'Confirm action'}
        ariaLabel={'confirm action popup'}
        description={'Description'}
        mixedWarning={'Warning'}
        attributions={undefined}
        localAction={{
          buttonText: 'Save locally',
          onClick: noop,
          isPending: true,
        }}
        globalAction={{
          buttonText: 'Save globally',
          onClick: noop,
          isPending: false,
        }}
        linkedResourcesTreeState={undefined}
        mixedAttributionCount={0}
        isResourceInfoReady
        isLocalActionAvailable={false}
      />,
    );

    expect(screen.getByRole('button', { name: 'Save locally' })).toBeVisible();
    expect(screen.getByRole('progressbar')).toBeVisible();
  });
});
