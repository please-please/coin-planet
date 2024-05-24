import { ipcRenderer } from 'electron';
import { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import { MyAssets } from '../../recoil/atom';
import { ASSETS_RETURN, GET_SAVED_ASSETS_DATA_FILE, SUCCESS } from '../../../constants';
import { I_coinOrderData } from '../../api/interface';

export const useGetAssetData = () => {
  const [isFetched, setIsFetched] = useState<boolean>();
  const [, setMyAssets] = useRecoilState<I_coinOrderData>(MyAssets);

  const reload = () => {
    setIsFetched(false);
    ipcRenderer.send(GET_SAVED_ASSETS_DATA_FILE);
    ipcRenderer.once(ASSETS_RETURN, (_, arg) => {
      if (arg.status === SUCCESS) {
        setMyAssets(arg.assetsData);
        setIsFetched(true);
      }
    });
  };

  useEffect(reload, []);

  return { reload, isFetched };
};
