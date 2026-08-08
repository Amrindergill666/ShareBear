export class FileWriter {
  private targetPath: string;

  constructor(targetPath: string) {
    this.targetPath = targetPath;
  }

  getPath(): string {
    return this.targetPath;
  }
}
