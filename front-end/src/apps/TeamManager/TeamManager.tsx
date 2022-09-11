import { ChangeEvent, FC } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import PaperLayout from 'src/layouts/PaperLayout';
import UploadButton from 'src/components/UploadButton/UploadButton';
import TeamsTable from 'src/features/components/TeamsTable/TeamsTable';
import TeamDialog from 'src/components/TeamDialog/TeamDialog';
import TeamRemovalDialog from 'src/components/TeamRemovalDialog/TeamRemovalDialog';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { teamDialogOpen, teamsAtom } from 'src/stores/Recoil';
import { postTeams } from 'src/api/ApiProvider';
import { useFlags } from 'src/stores/AppFlags';

import AddIcon from '@mui/icons-material/Add';
import { getTeamsFromFile } from './util/Converter';

const TeamManager: FC = () => {
  const setTeamDialogOpen = useSetRecoilState(teamDialogOpen);
  const [teams, setTeams] = useRecoilState(teamsAtom);

  const [flags, setFlag] = useFlags();

  const handleCreate = (): void => setTeamDialogOpen(true);

  const handleUpload = async (
    e: ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    if (!e.target.files || e.target.files.length <= 0) return;

    e.preventDefault();
    const reader = new FileReader();
    reader.onload = async (file: ProgressEvent<FileReader>): Promise<void> => {
      if (!file.target || !file.target.result) return;

      const importedTeams = getTeamsFromFile(file.target.result.toString());
      setTeams(importedTeams);
    };
    reader.readAsText(e.target.files[0]);
  };

  const handleSave = async (): Promise<void> => {
    try {
      if (flags.createdTeams) {
        console.log('somehow detected other changes');
      } else {
        await postTeams(teams);
        await setFlag('createdTeams', true);
      }
    } catch (e) {
      // TODO - Better error-handling
      console.log(e);
    }
  };

  return (
    <PaperLayout
      containerWidth='lg'
      header={<Typography variant='h4'>Team Manager</Typography>}
    >
      <TeamDialog />
      <TeamRemovalDialog />
      <Box
        sx={{
          marginBottom: (theme) => theme.spacing(2),
          display: 'flex',
          justifyContent: 'flex-end',
          gap: (theme) => theme.spacing(2)
        }}
      >
        <Button variant='contained' onClick={handleSave}>
          Save Changes
        </Button>
        {!flags.createdTeams && (
          <Button
            variant='contained'
            sx={{ padding: '6px', minWidth: '24px' }}
            onClick={handleCreate}
          >
            <AddIcon />
          </Button>
        )}
        {!flags.createdTeams && (
          <UploadButton title='Upload Teams' onUpload={handleUpload} />
        )}
      </Box>
      <TeamsTable teams={teams} />
    </PaperLayout>
  );
};

export default TeamManager;
