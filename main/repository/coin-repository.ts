import * as fs from 'fs';
import axios from 'axios';
import { v4 } from 'uuid';
import { sign } from 'jsonwebtoken';
import * as queryEncode from 'querystring';
import crypto from 'crypto';
import { coinList } from '../coinList';

import { prodJsonPath } from '../constants/utils';

export class CoinRepository {
  async getJsonData(name: string) {
    const filePath = prodJsonPath(name);
    if (!fs.existsSync(filePath)) {
      return { filePath, data: null };
    }

    const dataFile = fs.readFileSync(filePath, 'utf8');

    const data = JSON.parse(dataFile);
    return { filePath, data };
  }

  async writeJsonData(name: string, data: any) {
    const { filePath } = await this.getJsonData(name);
    fs.writeFileSync(filePath, JSON.stringify(data), 'utf8');
    return true;
  }

  async getCoinPrice() {
    return await axios.get(`https://api.upbit.com/v1/ticker?markets=${coinList.map((v: any) => v.market).join(',')}`);
  }

  async orderCoin(body) {
    try {
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
    } catch (error) {
      return { data: { error: error.message } };
    }
  }

  async getPurchasData(body: { uuid: string }) {
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

  async getCurrentPrice(arg: string[]) {
    return await axios.get(`https://api.upbit.com/v1/ticker?markets=${arg.join(',')}`);
  }

  async deleteJsonData(arg: string) {
    const filePath = prodJsonPath(arg);
    fs.unlinkSync(filePath as fs.PathLike);
  }
}
