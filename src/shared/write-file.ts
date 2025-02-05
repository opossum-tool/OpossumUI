// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { strToU8, zip } from 'fflate';
import fs from 'fs';

export const OPOSSUM_FILE_EXTENSION = '.opossum';
export const INPUT_FILE_NAME = 'input.json';
export const OUTPUT_FILE_NAME = 'output.json';

export function getDotOpossumFilePath(
  resourceFilePath: string,
  possibleExtensions: Array<string>,
): string {
  const fileExtensionLength = Math.max(
    ...possibleExtensions.map((extension) => {
      if (resourceFilePath.endsWith(`.${extension}`)) {
        return extension.length;
      }
      return 0;
    }),
  );

  const resourceFilePathWithoutFileExtension =
    fileExtensionLength === 0
      ? resourceFilePath
      : resourceFilePath.slice(0, -(fileExtensionLength + 1));

  return resourceFilePathWithoutFileExtension + OPOSSUM_FILE_EXTENSION;
}

export async function writeFile({
  content,
  path,
}: {
  path: string;
  content: string | object;
}): Promise<string> {
  try {
    await fs.promises.writeFile(
      path,
      typeof content === 'string' || Buffer.isBuffer(content)
        ? content
        : JSON.stringify(content),
    );
    return path;
  } catch (error) {
    throw new Error(
      `Error while writing the file ${path}: ${error?.toString()}`,
    );
  }
}

export function writeOpossumFile({
  input,
  path,
  output,
}: {
  input?: string | Uint8Array | object;
  output?: string | Uint8Array | object;
  path: string;
}): Promise<string> {
  return new Promise((resolve, reject) => {
    zip(
      {
        ...(input && {
          [INPUT_FILE_NAME]:
            input instanceof Uint8Array
              ? input
              : strToU8(
                  typeof input === 'string' ? input : JSON.stringify(input),
                ),
        }),
        ...(output && {
          [OUTPUT_FILE_NAME]:
            output instanceof Uint8Array
              ? output
              : strToU8(
                  typeof output === 'string'
                    ? output
                    : JSON.stringify(output, (_, value) =>
                        value instanceof Set ? [...value] : value,
                      ),
                ),
        }),
      },
      {
        level: 5,
      },
      async (err, data) => {
        if (err) {
          reject(err);
        } else {
          await fs.promises.writeFile(path, data);

          resolve(path);
        }
      },
    );
  });
}
