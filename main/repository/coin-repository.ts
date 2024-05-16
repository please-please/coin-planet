import * as fs from 'fs';

export class CoinRepository {
  async getJsonData(name: string) {
    const filePath = `${__dirname}/${name}.json`;
    const dataFile = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(dataFile);
    return { filePath, data };
  }

  async writeJsonData(filePath: string, data: any) {
    fs.writeFileSync(filePath, JSON.stringify(data), 'utf8');
    return true;
  }
}
