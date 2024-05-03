import electron from 'electron';
import { useEffect } from 'react';
import { useRecoilState } from 'recoil';
import { I_assetsData } from '../../pages/main';
import { MyAssets } from '../../recoil/atom';

const ipcRenderer = electron.ipcRenderer;

export const useGetAssetData = () => {
  const [, setMyAssets] = useRecoilState<I_assetsData>(MyAssets);

  const reload = () => {
    ipcRenderer.send('getSavedAssetsDataFile');
    ipcRenderer.once('assetsReturn', (_, arg) => {
      if (arg.status === 'success') {
        setMyAssets(arg.assetsData);
      }
    });
  };

  useEffect(reload, []);

  return reload;
};
