// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { DbProcessClient } from '../dbProcessClient';

interface FakeWebPort {
  postMessage: () => void;
  onmessage: ((event: MessageEvent) => void) | null;
}

function createFakePort(): FakeWebPort {
  return { postMessage: vi.fn(), onmessage: null };
}

function respond(port: FakeWebPort, response: object): void {
  port.onmessage?.({ data: response } as unknown as MessageEvent);
}

describe('DbProcessClient.flushSaves', () => {
  it('awaits the DB process answering the flushSaves request', async () => {
    const port = createFakePort();
    const client = new DbProcessClient(port);

    const idlePromise = client.flushSaves();
    expect(port.postMessage).toHaveBeenCalledWith({
      id: 0,
      type: 'flushSaves',
    });
    respond(port, { id: 0, type: 'success', result: 'failed' });

    await expect(idlePromise).resolves.toBe('failed');
  });

  it('resolves to undefined when no write happened since the file was loaded', async () => {
    const port = createFakePort();
    const client = new DbProcessClient(port);

    const idlePromise = client.flushSaves();
    respond(port, { id: 0, type: 'success', result: undefined });

    await expect(idlePromise).resolves.toBeUndefined();
  });

  it('rejects when the DB process has exited', async () => {
    const port = createFakePort();
    const client = new DbProcessClient(port);

    client.failPendingRequests(new Error('The DB process exited.'));

    await expect(client.flushSaves()).rejects.toThrow(
      'The DB process has exited; no further requests are sent.',
    );
    expect(port.postMessage).not.toHaveBeenCalled();
  });
});
