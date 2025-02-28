import { useEffect, useState } from 'react';
import { I_coinSettingData } from '../../constants/interface';
import { getCoinSetting } from '../../utils';

export const useGetCoinSetting = () => {
  const [coinSettingData, setCoinSettingData] = useState<I_coinSettingData>();

  const refetch = () => {
    getCoinSetting((data) => {
      setCoinSettingData(data);
    });
  };

  useEffect(refetch, []);

  return { refetch, coinSettingData };
};
