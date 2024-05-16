import { ipcMain } from 'electron';
import { FAIL, REPLY, SAVE_FILE, SUCCESS } from '../constants';
import { CoinService } from './service/coin-service';

export class Routes {
  constructor(private coinServcie: CoinService) {}
  eventRegister() {
    ipcMain.on(SAVE_FILE, async (evt, arg) => {
      if (arg.accessKey === '' || arg.secretKey === '') {
        evt.sender.send(REPLY, { status: FAIL });
        return;
      }

      const result = await this.coinServcie.saveUserData(arg);
      if (!result) {
        evt.sender.send(REPLY, { status: FAIL });
        return;
      }

      evt.sender.send(REPLY, { status: SUCCESS });
    });
  }
}
