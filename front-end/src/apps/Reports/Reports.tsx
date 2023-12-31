import { FC, ReactNode, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import PaperLayout from 'src/layouts/PaperLayout';
import TwoColumnHeader from 'src/components/Headers/TwoColumnHeader';
import GeneralReports from './GeneralReports';
import ReportView from './components/ReportView';
import { useRecoilState, useRecoilValue } from 'recoil';
import TournamentReports from './TournamentReports';
import EventTournamentsDropdown from 'src/components/Dropdowns/EventTournamentsDropdown';
import {
  currentEventKeySelector,
  currentTournamentKeyAtom,
  currentTournamentSelector
} from 'src/stores/NewRecoil';
import { Tournament } from '@toa-lib/models';

const Reports: FC = () => {
  const eventKey = useRecoilValue(currentEventKeySelector);
  const [tournamentKey, setTournamentKey] = useRecoilState(
    currentTournamentKeyAtom
  );
  const tournament = useRecoilValue(currentTournamentSelector);
  const [report, setReport] = useState<ReactNode | null>(null);

  const handleTournamentChange = (tournament: Tournament | null) => {
    if (!tournament) return;
    setTournamentKey(tournament.tournamentKey);
    setReport(null);
  };
  const handleReportUpdate = (c: ReactNode) => {
    setReport(c);
  };
  const handleReturn = () => setReport(null);

  return (
    <PaperLayout
      containerWidth='xl'
      header={
        <TwoColumnHeader
          left={<Typography variant='h4'>Reports</Typography>}
          right={
            <EventTournamentsDropdown
              eventKey={eventKey}
              value={tournamentKey}
              onChange={handleTournamentChange}
            />
          }
        />
      }
    >
      <Box sx={{ padding: (theme) => theme.spacing(3) }}>
        {report ? (
          <ReportView onReturn={handleReturn}>{report}</ReportView>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Typography variant='h4' gutterBottom>
              {tournament?.name} Reports
            </Typography>
            <TournamentReports onGenerate={handleReportUpdate} />
            <GeneralReports onGenerate={handleReportUpdate} />
          </Box>
        )}
      </Box>
    </PaperLayout>
  );
};

export default Reports;
