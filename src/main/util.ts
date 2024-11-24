/* eslint import/prefer-default-export: off */
import { URL } from 'url';
import path from 'path';
import { app } from 'electron';

export function resolveHtmlPath(htmlFileName: string, route: string = '') {
  const routeString = route ? '#/' + route : '';
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT || 1212;
    const url = new URL(`http://localhost:${port}${routeString}`);
    url.pathname = htmlFileName;
    return url.href;
  }
  return `file://${path.resolve(__dirname, '../renderer/', htmlFileName)}${routeString}`;
}

export function getAssetPath(...paths: string[]): string {
  let RESOURCES_PATH = app.isPackaged ?
    path.join(process.resourcesPath, 'assets') :
    path.join(__dirname, '../../assets');
  return path.join(RESOURCES_PATH, ...paths);
}
