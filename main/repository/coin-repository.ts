import * as fs from 'fs';
import axios from 'axios';
import { v4 } from 'uuid';
import { sign } from 'jsonwebtoken';
import * as queryEncode from 'querystring';
import crypto from 'crypto';
import { DataType } from '../coinList';

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

  async getCoinPrice(coinList: DataType[]) {
    return await axios.get(`https://api.upbit.com/v1/ticker?markets=${coinList.map((v: any) => v.market).join(',')}`);
  }

  async orderCoin(body: any) {
    const { data: userData } = await this.getJsonData('private_user_data');
    const query = queryEncode.encode(body);

    const hash = crypto.createHash('sha512');
    const queryHash = hash.update(query, 'utf-8').digest('hex');

    const payload = {
      access_key: userData.accessKey,
      nonce: v4(),
      query_hash: queryHash,
      query_hash_alg: 'SHA512',
    };

    const token = sign(payload, userData.secretKey);

    return await axios.post('https://api.upbit.com/v1/orders', body, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getPurchasData(body: { uuid: string }) {
    const query = queryEncode.encode(body);

    const hash = crypto.createHash('sha512');
    const queryHash = hash.update(query, 'utf-8').digest('hex');

    const payload = {
      access_key: 'qNVJMiRTRK3Nr24cMswV7OUI6cBeZ52lLOOrPAkp',
      nonce: v4(),
      query_hash: queryHash,
      query_hash_alg: 'SHA512',
    };

    const token = sign(payload, 'JTJuKZtxvfHZtx52ftjbEFaNLzobWaz4P1Btpsed');

    try {
      const response = await axios.get(`https://api.upbit.com/v1/order?${query}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: body,
      });
      return response;
    } catch (error) {
      console.error(error);
    }
  }
}
