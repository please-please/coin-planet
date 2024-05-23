import * as path from 'path';

export const prodJsonPath = (filename: string): string => {
  if (process.env.NODE_ENV === 'development') {
    return `${__dirname}/../${filename}.json`;
  }
  return path.join(__dirname, '../../', `${filename}.json`);
};
