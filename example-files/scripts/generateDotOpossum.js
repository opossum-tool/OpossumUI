// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

const fs = require('fs');
const JSZip = require('jszip');
const glob = require('glob');
const path = require('path');

const exampleFilesDirectory = path.join(__dirname, '..');

const { inputFilePaths, attributionFilePaths } =
  getInputAndAttributionFilePaths(exampleFilesDirectory);

for (const inputFilePath of inputFilePaths) {
  const inputFilePathParsed = path.parse(inputFilePath);
  const inputFileDirectory = inputFilePathParsed.dir;
  const dotOpossumFileName = `${inputFilePathParsed.name}.opossum`;
  const dotOpossumFilePath = path.join(inputFileDirectory, dotOpossumFileName);

  if (!fs.existsSync(dotOpossumFilePath)) {
    const dotOpossumArchive = new JSZip();
    const dotOpossumWriteStream = fs.createWriteStream(dotOpossumFilePath);

    addInputJsonToArchive(dotOpossumArchive, inputFilePath);

    addAttributionsJsonToArchive(
      dotOpossumArchive,
      inputFilePath,
      attributionFilePaths
    );

    dotOpossumArchive
      .generateAsync({
        type: 'nodebuffer',
        streamFiles: true,
        compression: 'DEFLATE',
        compressionOptions: { level: 9 },
      })
      .then((output) => dotOpossumWriteStream.write(output));

    console.log('Created: ' + dotOpossumFilePath);
  } else {
    console.log('File does already exist: ' + dotOpossumFilePath);
  }
}

function getInputAndAttributionFilePaths(exampleFilesDirectory) {
  const jsonFilePaths = glob.sync(`${exampleFilesDirectory}/**/*.json`);
  const inputFilePaths = [];
  const attributionFilePaths = [];
  jsonFilePaths.forEach((filePath) =>
    filePath.endsWith('_attributions.json')
      ? attributionFilePaths.push(filePath)
      : inputFilePaths.push(filePath)
  );
  return { inputFilePaths, attributionFilePaths };
}

function addInputJsonToArchive(archive, inputFilePath) {
  const inputJson = fs.readFileSync(inputFilePath, { encoding: 'utf-8' });
  archive.file('input.json', inputJson);
}

function addAttributionsJsonToArchive(
  archive,
  inputFilePath,
  attributionFilePaths
) {
  const expectedAssociatedAttributionFilePath =
    inputFilePath.slice(0, -5) + '_attributions.json';
  if (attributionFilePaths.includes(expectedAssociatedAttributionFilePath)) {
    const outputJson = fs.readFileSync(expectedAssociatedAttributionFilePath, {
      encoding: 'utf-8',
    });
    archive.file('output.json', outputJson);
  }
}
