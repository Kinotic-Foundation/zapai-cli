import { GrokTool } from '../tools/GrokTool.js';

export interface ChatStreamer {
  streamChat(userInput: string, fileIds: string[], tool: GrokTool | null): Promise<void>;
}

export interface FileUploader {
  uploadFiles(paths: string[]): Promise<void>;
  getLastFileIds(): string[];
  clearFileIds(): void;
}

