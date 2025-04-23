import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { FileUploader as FileUploaderInterface } from '../common/Interfaces.js';
import { WebUiOptions } from './ChatStreamer.js';

interface FileUploadResponse {
  id: string;
}

interface FileUploadError {
  detail: string;
}

export class FileUploader implements FileUploaderInterface {
  constructor(
    private fileIds: string[],
    private cwd: string,
    private options: WebUiOptions
  ) {}

  async uploadFiles(paths: string[]): Promise<void> {
    for (const filePath of paths) {
      try {
        const fileName = path.relative(this.cwd, path.resolve(filePath));
        const content = await fs.readFile(filePath);
        const formData = new FormData();
        formData.append('file', content, fileName);

        const response = await fetch(`${this.options.serverUrl}/api/v1/files/`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.options.apiKey}`,
            Accept: 'application/json',
            ...formData.getHeaders(),
          },
          body: formData,
        });

        if (!response.ok) {
          const errorJson = await response.json();
          if (isFileUploadError(errorJson)) {
            throw new Error(errorJson.detail || 'Failed to upload file');
          } else {
            throw new Error('Failed to upload file: Unknown error format');
          }
        }

        const result = await response.json();
        if (isFileUploadResponse(result) && result.id) {
          this.fileIds.push(result.id);
          console.log(chalk.green(`Uploaded file: ${fileName} (ID: ${result.id})`));
        } else {
          console.log(chalk.red(`Failed to upload file: ${fileName}. Response: ${JSON.stringify(result)}`));
        }
      } catch (error) {
        console.log(chalk.red(`Upload error for ${filePath}: ${(error as Error).message}`));
      }
    }
  }
}

function isFileUploadResponse(obj: any): obj is FileUploadResponse {
  return obj && typeof obj === 'object' && 'id' in obj && typeof obj.id === 'string';
}

function isFileUploadError(obj: any): obj is FileUploadError {
  return obj && typeof obj === 'object' && 'detail' in obj && typeof obj.detail === 'string';
}
