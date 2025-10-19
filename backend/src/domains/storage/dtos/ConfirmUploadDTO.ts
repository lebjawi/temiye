import { ValidationError } from '../../../shared/errors/ValidationError';

/**
 * DTO for confirming a file upload
 */
export class ConfirmUploadDTO {
  fileId!: string;

  constructor(data: any) {
    this.fileId = data.fileId;
  }

  validate(): void {
    if (!this.fileId || this.fileId.trim().length === 0) {
      throw new ValidationError('File ID is required');
    }
  }
}
