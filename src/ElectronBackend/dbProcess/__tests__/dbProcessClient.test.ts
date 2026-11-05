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

describe('DbProcessClient.whenMutationsSettled', () => {
  it('awaits the DB process answering the whenIdle request', async () => {
    const port = createFakePort();
    const client = new DbProcessClient(port);

    const idlePromise = client.whenMutationsSettled();
    expect(port.postMessage).toHaveBeenCalledWith({ id: 0, type: 'whenIdle' });
    respond(port, { id: 0, type: 'success', result: undefined });

    await expect(idlePromise).resolves.toBeUndefined();
  });

  it('rejects when the DB process has exited', async () => {
    const port = createFakePort();
    const client = new DbProcessClient(port);

    client.failPendingRequests(new Error('The DB process exited.'));

    await expect(client.whenMutationsSettled()).rejects.toThrow(
      'The DB process has exited; no further requests are sent.',
    );
    expect(port.postMessage).not.toHaveBeenCalled();
  });
});

describe('DbProcessClient.getLastSaveResult', () => {
  it('requests the last save result from the DB process', async () => {
    const port = createFakePort();
    const client = new DbProcessClient(port);

    const resultPromise = client.getLastSaveResult();
    expect(port.postMessage).toHaveBeenCalledWith({
      id: 0,
      type: 'getLastSaveResult',
    });
    respond(port, { id: 0, type: 'success', result: 'failed' });

    await expect(resultPromise).resolves.toBe('failed');
  });

  it('resolves to undefined when no write happened since the file was loaded', async () => {
    const port = createFakePort();
    const client = new DbProcessClient(port);

    const resultPromise = client.getLastSaveResult();
    respond(port, { id: 0, type: 'success', result: undefined });

    await expect(resultPromise).resolves.toBeUndefined();
  });
});
