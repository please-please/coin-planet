import electron from 'electron';
import { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import { I_assetsData } from '../../pages/main';
import { MyAssets } from '../../recoil/atom';

const ipcRenderer = electron.ipcRenderer;

export const useGetAssetData = () => {
  const [isFetched, setIsFetched] = useState<boolean>();
  const [, setMyAssets] = useRecoilState<I_assetsData>(MyAssets);

  const reload = () => {
    setIsFetched(false);
    ipcRenderer.send('getSavedAssetsDataFile');
    ipcRenderer.once('assetsReturn', (_, arg) => {
      if (arg.status === 'success') {
        setMyAssets(arg.assetsData);
        setIsFetched(true);
      }
    });
  };

  useEffect(reload, []);

  return { reload, isFetched };
};
