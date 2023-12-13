// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';

import { renderComponent } from '../../../test-helpers/render';
import { ReportTableHeader } from '../ReportTableHeader';

describe('The report view table header', () => {
  it('renders', () => {
    renderComponent(<ReportTableHeader />);

    expect(screen.getByText('License'));
    expect(screen.getByText('Version'));
    expect(screen.getAllByText('Name').length).toBe(1);
    expect(screen.getByText('Copyright'));
    expect(screen.getByText('License Text'));
    expect(screen.getByText('Confidence'));
    expect(screen.getByText('Comment'));
    expect(screen.getByText('URL'));
    expect(screen.getByText('Resources'));
  });
});
