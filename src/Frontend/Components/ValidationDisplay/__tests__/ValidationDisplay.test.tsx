// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ValidationDisplay } from '../ValidationDisplay';

describe('ValidationDisplay', () => {
  describe('when messages array is empty', () => {
    it('renders nothing', () => {
      const { container } = render(
        <ValidationDisplay messages={[]} severity="error" />,
      );

      expect(container).toHaveTextContent('');
    });
  });

  describe('when there is a single message', () => {
    it('renders the message', () => {
      render(<ValidationDisplay messages={['Test error']} severity="error" />);

      expect(screen.getByText('Test error')).toBeVisible();
    });

    it('does not render expand button', () => {
      render(<ValidationDisplay messages={['Test error']} severity="error" />);

      expect(
        screen.queryByLabelText('expand messages'),
      ).not.toBeInTheDocument();
    });
  });

  describe('when there are multiple messages', () => {
    const messages = ['First message', 'Second message', 'Third message'];

    it('renders only first message visibly', () => {
      render(<ValidationDisplay messages={messages} severity="error" />);

      expect(screen.getByText('First message')).toBeVisible();

      expect(screen.getByLabelText('expand messages')).toBeInTheDocument();

      expect(screen.getByText('Second message')).not.toBeVisible();
      expect(screen.getByText('Third message')).not.toBeVisible();
    });

    it('shows remaining messages when expand button is clicked', async () => {
      render(<ValidationDisplay messages={messages} severity="error" />);

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
        expect(screen.getByTestId('WarningAmberIcon')).toBeInTheDocument();
      },
    );
  });

  describe('with ReactNode messages', () => {
    it('renders complex ReactNode messages', () => {
      const messages = [
        <span key="1">
          Message with <strong>bold text</strong>
        </span>,
        'Plain text message',
      ];

      render(<ValidationDisplay messages={messages} severity="warning" />);

      expect(screen.getByText('bold text')).toBeVisible();
      expect(screen.getByText('bold text')).toHaveStyle({ fontWeight: 'bold' });
    });
  });
});
