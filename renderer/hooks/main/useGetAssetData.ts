import { ipcRenderer } from 'electron';
import { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import { I_assetsData } from '../../pages/main';
import { MyAssets } from '../../recoil/atom';
import { ASSETS_RETURN, GET_SAVED_ASSETS_DATA_FILE, SUCCESS } from '../../../constants';

export const useGetAssetData = () => {
  const [isFetched, setIsFetched] = useState<boolean>();
  const [, setMyAssets] = useRecoilState<I_assetsData>(MyAssets);

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
