import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  existsSync,
  unlinkSync,
} from 'fs';

import {
  basename,
  join,
} from 'path';

@Injectable()
export class UploadsService {
  buildFileUrl(
    request: any,
    filename: string,
  ): string {
    return `${request.protocol}://${request.get(
      'host',
    )}/uploads/${filename}`;
  }

  buildSingleUploadResponse(
    request: any,
    file: Express.Multer.File,
  ) {
    return {
      message: 'Image uploaded successfully',
      file: {
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: this.buildFileUrl(
          request,
          file.filename,
        ),
      },
    };
  }

  buildMultipleUploadResponse(
    request: any,
    files: Express.Multer.File[],
  ) {
    return {
      message: 'Images uploaded successfully',
      files: files.map((file) => ({
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: this.buildFileUrl(
          request,
          file.filename,
        ),
      })),
    };
  }

  deleteFile(
    filenameOrUrl: string,
  ) {
    const filename =
      this.extractFilename(
        filenameOrUrl,
      );

    const filePath = join(
      process.cwd(),
      'uploads',
      filename,
    );

    if (!existsSync(filePath)) {
      throw new NotFoundException(
        'Uploaded file not found',
      );
    }

    unlinkSync(filePath);

    return {
      message: 'Image deleted successfully',
    };
  }

  private extractFilename(
    filenameOrUrl: string,
  ): string {
    return basename(
      filenameOrUrl
        .split('?')[0]
        .split('#')[0],
    );
  }
}
