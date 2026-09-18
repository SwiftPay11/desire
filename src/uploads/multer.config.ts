import {
  BadRequestException,
} from '@nestjs/common';

import {
  MulterModuleOptions,
} from '@nestjs/platform-express';

import {
  diskStorage,
} from 'multer';

import {
  existsSync,
  mkdirSync,
} from 'fs';

import {
  extname,
  join,
} from 'path';

const uploadDirectory = join(
  process.cwd(),
  'uploads',
);

if (!existsSync(uploadDirectory)) {
  mkdirSync(uploadDirectory, {
    recursive: true,
  });
}

export const multerConfig: MulterModuleOptions = {
  storage: diskStorage({
    destination: (
      request,
      file,
      callback,
    ) => {
      callback(
        null,
        uploadDirectory,
      );
    },

    filename: (
      request,
      file,
      callback,
    ) => {
      const extension =
        extname(file.originalname)
          .toLowerCase();

      const originalName =
        file.originalname
          .replace(extension, '')
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');

      const uniqueSuffix =
        `${Date.now()}-${Math.round(
          Math.random() * 1_000_000_000,
        )}`;

      const filename =
        `${originalName}-${uniqueSuffix}${extension}`;

      callback(
        null,
        filename,
      );
    },
  }),

  fileFilter: (
    request,
    file,
    callback,
  ) => {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (
      !allowedMimeTypes.includes(
        file.mimetype,
      )
    ) {
      return callback(
        new BadRequestException(
          'Only JPG, JPEG, PNG and WEBP images are allowed',
        ),
        false,
      );
    }

    callback(
      null,
      true,
    );
  },

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10,
  },
};