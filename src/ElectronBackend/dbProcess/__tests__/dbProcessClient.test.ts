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

describe('DbProcessClient.whenIdle', () => {
  it('resolves immediately when there are no pending requests', async () => {
    const port = createFakePort();
    const client = new DbProcessClient(port);

    await expect(client.whenIdle()).resolves.toBeUndefined();
  });

  it('resolves once all pending requests have been answered', async () => {
    const port = createFakePort();
    const client = new DbProcessClient(port);

    const savePromise = client.saveFile({
      projectId: 'uuid_1',
      opossumFilePath: '/some/path.opossum',
    });
    const unlockPromise = client.forceUnlock({
      projectId: 'uuid_1',
      opossumFilePath: '/some/path.opossum',
    });
    const idlePromise = client.whenIdle();

    respond(port, { id: 0, type: 'success', result: undefined });
    respond(port, { id: 1, type: 'success', result: undefined });
    await expect(idlePromise).resolves.toBeUndefined();
    await expect(savePromise).resolves.toBeUndefined();
    await expect(unlockPromise).resolves.toBeUndefined();
  });

  it('resolves when pending requests fail', async () => {
    const port = createFakePort();
    const client = new DbProcessClient(port);

    const savePromise = client.saveFile({
      projectId: 'uuid_1',
      opossumFilePath: '/some/path.opossum',
    });
    const idlePromise = client.whenIdle();

    respond(port, { id: 0, type: 'error', error: 'write failed' });
    await expect(idlePromise).resolves.toBeUndefined();
    await expect(savePromise).rejects.toThrow('write failed');
  });

  it('rejects remaining requests and resolves whenIdle when the DB process fails them', async () => {
    const port = createFakePort();
    const client = new DbProcessClient(port);

    const savePromise = client.saveFile({
      projectId: 'uuid_1',
      opossumFilePath: '/some/path.opossum',
    });
    const idlePromise = client.whenIdle();

    client.failPendingRequests(new Error('The DB process exited.'));

    await expect(idlePromise).resolves.toBeUndefined();
    await expect(savePromise).rejects.toThrow('The DB process exited.');
    expect(client.isDead()).toBe(true);
  });

  it('rejects new requests immediately after the DB process failed them', async () => {
    const port = createFakePort();
    const client = new DbProcessClient(port);

    client.failPendingRequests(new Error('The DB process exited.'));

    await expect(
      client.saveFile({
        projectId: 'uuid_1',
        opossumFilePath: '/some/path.opossum',
      }),
    ).rejects.toThrow(
      'The DB process has exited; no further requests are sent.',
    );
    await expect(client.whenIdle()).resolves.toBeUndefined();
    expect(port.postMessage).not.toHaveBeenCalled();
  });
});
