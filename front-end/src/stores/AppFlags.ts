import { useRecoilState } from 'recoil';
import { setApiStorage, setApiStorageKey } from 'src/api/ApiProvider';
import { appFlagsAtom } from './Recoil';

export interface AppFlags {
  createdEvent: boolean;
  createdTeams: boolean;
  createdAccounts: boolean;
}

export const defaultFlags: AppFlags = {
  createdEvent: false,
  createdTeams: false,
  createdAccounts: false
};

export function useFlags(): [
  AppFlags,
  (flag: keyof AppFlags, value: boolean) => Promise<void>,
  () => Promise<void>
] {
  const [appFlags, setAppFlags] = useRecoilState(appFlagsAtom);

  const setterOrUpdater = async (
    flag: keyof AppFlags,
    value: boolean
  ): Promise<void> => {
    setAppFlags({ ...appFlags, [flag]: value });
    setFlag(flag, value);
  };

  const purge = async (): Promise<void> => {
    setAppFlags(defaultFlags);
    await purgeFlags();
  };

  return [appFlags, setterOrUpdater, purge];
}

async function setFlag(flag: keyof AppFlags, value: boolean): Promise<void> {
  await setApiStorageKey('flags.json', flag, value);
  return;
}

async function purgeFlags(): Promise<void> {
  await setApiStorage('flags.json', {});
  return;
}
