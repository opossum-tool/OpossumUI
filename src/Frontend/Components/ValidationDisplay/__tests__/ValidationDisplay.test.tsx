// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { OpossumColors } from '../../../shared-styles';
import { ValidationDisplay } from '../ValidationDisplay';

describe('ValidationDisplay', () => {
  describe('when messages array is empty', () => {
    it('renders nothing', () => {
      const { container } = render(
        <ValidationDisplay messages={[]} severity="error" />,
      );

      expect(container).toHaveTextContent('');
      expect(screen.getByTestId('WarningAmberIcon')).not.toBeVisible();
    });
  });

  describe('when there is a single message', () => {
    it('renders the message but not the expand button', () => {
      render(<ValidationDisplay messages={['Test error']} severity="error" />);

      expect(screen.getByText('Test error')).toBeVisible();
      expect(
        screen.queryByLabelText('expand messages'),
      ).not.toBeInTheDocument();
    });
  });

  describe('when there are multiple messages', () => {
    const messages = ['First message', 'Second message', 'Third message'];

    it('renders only first message and then the others upon expand', async () => {
      render(<ValidationDisplay messages={messages} severity="error" />);

      expect(screen.getByText('First message')).toBeVisible();

      expect(screen.getByText('Second message')).not.toBeVisible();
      expect(screen.getByText('Third message')).not.toBeVisible();

      await userEvent.click(screen.getByLabelText('expand messages'));

      expect(screen.getByText('Second message')).toBeVisible();
      expect(screen.getByText('Third message')).toBeVisible();
    });

    it('hides remaining messages when expand button is clicked again', async () => {
      render(<ValidationDisplay messages={messages} severity="error" />);

      await userEvent.click(screen.getByLabelText('expand messages'));
      await userEvent.click(screen.getByLabelText('expand messages'));

      await waitFor(() => {
        expect(screen.getByText('Second message')).not.toBeVisible();
      });
      expect(screen.getByText('Third message')).not.toBeVisible();
    });
  });

  describe('severity', () => {
    it.each(['error', 'warning'] as const)(
      'renders correctly with %s severity',
      (severity) => {
        render(
          <ValidationDisplay messages={['Test message']} severity={severity} />,
        );

        expect(screen.getByText('Test message')).toBeVisible();
        expect(screen.getByTestId('WarningAmberIcon')).toHaveStyle({
          color: severity === 'error' ? OpossumColors.red : OpossumColors.brown,
        });
      },
    );
  });

  describe('with ReactNode messages', () => {
    it('renders complex italic text', () => {
      const messages = [
        <>
          Message with <em>italic text</em>
        </>,
      ];

      render(<ValidationDisplay messages={messages} severity="warning" />);

      const italicText = screen.getByText('italic text');
      expect(italicText).toBeVisible();
      expect(italicText.tagName).toBe('EM');
    });
  });
});
