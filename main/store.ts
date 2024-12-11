import { settingArg } from './interface';

class StoreData {
  privateData = false;
  watching = {};
  boosting = {};
  constructor() {}

  async changeWatching(arg: settingArg) {
    const { market } = arg;
    this.watching[market] = !this.watching[market];
  }

  async changeBoosting(arg: settingArg) {
    const { market } = arg;
    this.boosting[market] = !this.boosting[market];
  }

  async changePrivateData() {
    this.privateData = !this.privateData;
  }
}

export const storeData = new StoreData();
