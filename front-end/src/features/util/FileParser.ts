import { Team } from '@toa-lib/models';

export const parseTeamsFile = async (
  file: File,
  eventKey: string
): Promise<Team[]> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (data: ProgressEvent<FileReader>) => {
      if (!data.target || !data.target.result) {
        resolve([]);
        return;
      }
      resolve(
        data.target.result
          .toString()
          .split('\n')
          .map((team) => {
            const t = team.split(',');
            return {
              eventKey,
              teamKey: parseInt(t[0]),
              teamNameLong: t[1],
              teamNameShort: t[2],
              robotName: t[3],
              city: t[4],
              stateProv: t[5],
              country: t[6],
              countryCode: t[7],
              cardStatus: 0,
              hasCard: false,
              rookieYear: parseInt(t[8])
            };
          })
      );
    };
    reader.readAsText(file);
  });
};
