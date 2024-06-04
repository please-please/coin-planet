import { ipcRenderer } from 'electron';
import { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import { MyAssets } from '../../recoil/atom';
import { ASSETS_RETURN, FAIL, GET_SAVED_ASSETS_DATA_FILE, SUCCESS } from '../../../constants';
import { I_coinOrderData } from '../../api/interface';

export const useGetAssetData = () => {
  const [isFetched, setIsFetched] = useState<boolean>();
  const [myAssets, setMyAssets] = useRecoilState<I_coinOrderData>(MyAssets);

  const reload = () => {
    setIsFetched(false);
    ipcRenderer.send(GET_SAVED_ASSETS_DATA_FILE);
    ipcRenderer.once(ASSETS_RETURN, (_, arg) => {
      if (arg.status === FAIL) alert('assetdata reload fail');
      if (arg.status === SUCCESS) {
        setMyAssets(arg.assetsData);
      }
    });
  };

  useEffect(() => {
    if (Object.keys(myAssets).length > 0) setIsFetched(true);
  }, [myAssets]);

  useEffect(reload, []);

  return { reload, isFetched };
};
