import { FC } from 'react';
import Grid from '@mui/material/Grid';
import DefaultLayout from 'src/layouts/DefaultLayout';
import AppCard, { AppCardProps } from 'src/components/AppCard/AppCard';

import twitchLogo from 'src/assets/images/twitch-logo.png';
import audienceDisplayLogo from 'src/assets/images/audience-display-logo.png';
import settingsLogo from 'src/assets/images/settings-logo.png';

const GridAppCard = (props: AppCardProps) => (
  <Grid item xs={5} md={3}>
    <AppCard {...props} />
  </Grid>
);

// TODO - Just incorporate from AppRoutes to eliminate having to modify 2+ places.
const HomeApp: FC = () => {
  return (
    <DefaultLayout>
      <Grid container spacing={4} columns={15}>
        <GridAppCard title='Event Manager' to='/event-manager' />
        <GridAppCard title='Team Manager' to='/team-manager' />
        <GridAppCard title='Match Manager' to='/match-manager' />
        <GridAppCard title='Account Manager' to='/accounts' />
        <GridAppCard title='Scoring App' to='/scoring' />
        <GridAppCard title='Admin App' to='/admin' />
        <GridAppCard
          title='Streaming App'
          href='https://twitch.tv/theorangealliance2'
          imgSrc={twitchLogo}
        />
        <GridAppCard title='Audience Display' imgSrc={audienceDisplayLogo} />
        <GridAppCard title='Report App' />
        <GridAppCard title='Settings' imgSrc={settingsLogo} to='/settings' />
      </Grid>
    </DefaultLayout>
  );
};

export default HomeApp;
