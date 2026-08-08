export class FileReader {
  private fileUri: string;
  private fileName: string;
  private fileSize: number;
  private mimeType: string;

  constructor(fileUri: string, fileName: string, fileSize: number, mimeType: string) {
    this.fileUri = fileUri;
    this.fileName = fileName;
    this.fileSize = fileSize;
    this.mimeType = mimeType;
  }

  getUri(): string {
    return this.fileUri;
  }

  getName(): string {
    return this.fileName;
  }

  getSize(): number {
    return this.fileSize;
  }

  getMimeType(): string {
    return this.mimeType;
  }
}
