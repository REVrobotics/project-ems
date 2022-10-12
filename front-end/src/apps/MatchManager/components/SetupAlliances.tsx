import { FC } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import { useRecoilState, useRecoilValue } from 'recoil';
import {
  allinaceMembers,
  eventKeySelector,
  selectedTournamentLevel
} from 'src/stores/Recoil';
import { AllianceMember, defaultAllianceMember, Team } from '@toa-lib/models';
import AutocompleteTeam from 'src/features/components/AutocompleteTeam/AutoCompleteTeam';
import { replaceInArray } from 'src/stores/Util';
import { postAllianceMembers } from 'src/api/ApiProvider';

const SetupAlliances: FC = () => {
  const [allianceMembers, setAllianceMembers] = useRecoilState(allinaceMembers);
  const eventKey = useRecoilValue(eventKeySelector);
  const level = useRecoilValue(selectedTournamentLevel);

  const generateSlots = () => {
    const newMembers: AllianceMember[] = [];
    for (let i = 0; i < 4; i++) {
      newMembers.push({
        ...defaultAllianceMember,
        allianceKey: `${eventKey}-${level}-A${allianceMembers.length + i}`,
        allianceRank: allianceMembers.length / 4 + 1,
        isCaptain: i === 0,
        order: i + 1,
        tournamentLevel: level
      });
    }
    setAllianceMembers((prev) => [...prev, ...newMembers]);
  };

  const postAlliances = async () => {
    await postAllianceMembers(allianceMembers);
  };

  return (
    <Box sx={{ padding: (theme) => theme.spacing(3) }}>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={12} md={3}>
          <Button variant='contained' onClick={generateSlots}>
            Generate Alliance Slots
          </Button>
        </Grid>
        <Grid item xs={12} sm={12} md={9} />
        {allianceMembers.map((a) => {
          const onUpdate = (team: Team | null) => {
            if (team) {
              const newMembers = replaceInArray<AllianceMember>(
                allianceMembers,
                'allianceKey',
                a.allianceKey,
                { ...a, teamKey: team.teamKey }
              );
              setAllianceMembers(newMembers ? newMembers : []);
            }
          };

          return (
            <Grid key={a.allianceKey} item xs={12} sm={6} md={3}>
              <AutocompleteTeam
                teamKey={a.teamKey === -1 ? null : a.teamKey}
                onUpdate={onUpdate}
              />
            </Grid>
          );
        })}
        {allianceMembers.length > 0 && (
          <Grid item xs={12} sm={12} md={3}>
            <Button variant='contained' onClick={postAlliances}>
              Post Alliances
            </Button>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default SetupAlliances;
