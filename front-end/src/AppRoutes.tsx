import { ReactNode } from 'react';
import HomeApp from './apps/Home';
import EventManagerApp from './apps/EventManager';
import SettingsApp from './apps/Settings';
import AccountManager from './apps/AccountManager';
import AdminApp from './apps/Admin/AdminApp';
import TeamManager from './apps/TeamManager';
import MatchManager from './apps/MatchManager';
import ScoringApp from './apps/Scoring';
import { RefereeApp, ScoreKeeper, HeadReferee } from './apps/Referee';
import AudienceDisplay from './apps/AudienceDisplay';
import FieldDebugger from './apps/FieldDebugger';

import HomeIcon from '@mui/icons-material/Home';
import EventIcon from '@mui/icons-material/Event';

export interface AppRoute {
  name: string;
  path: string;
  group: number;
  element: ReactNode;
  icon?: ReactNode;
  hidden?: boolean;
  routes?: AppRoute[];
}

const AppRoutes: AppRoute[] = [
  {
    name: 'Home',
    path: '/',
    group: 0,
    element: <HomeApp />,
    icon: <HomeIcon />
  },
  {
    name: 'Event Manager',
    path: '/event-manager',
    group: 0,
    element: <EventManagerApp />,
    icon: <EventIcon />
  },
  {
    name: 'Team Manager',
    path: '/team-manager',
    group: 0,
    element: <TeamManager />,
    hidden: true
  },
  {
    name: 'Match Manager',
    path: '/match-manager',
    group: 0,
    element: <MatchManager />,
    hidden: true
  },
  {
    name: 'Account Manager',
    path: '/accounts',
    group: 0,
    element: <AccountManager />,
    hidden: false
  },
  {
    name: 'Scoring App',
    path: '/scoring',
    group: 0,
    element: <ScoringApp />
  },
  {
    name: 'Referee App',
    path: '/referee',
    group: 0,
    element: <RefereeApp />
  },
  {
    name: 'Score Keeper Page',
    path: '/referee/scorekeeper',
    group: 0,
    element: <ScoreKeeper />
  },
  {
    name: 'Head Referee page',
    path: '/referee/head',
    group: 0,
    element: <HeadReferee />
  },
  {
    name: 'Audience Display',
    path: '/audience',
    group: 0,
    element: <AudienceDisplay />
  },
  {
    name: 'Admin App',
    path: '/admin',
    group: 0,
    element: <AdminApp />,
    hidden: true
  },
  {
    name: 'Field Debugger',
    path: '/fcs-debug',
    group: 0,
    element: <FieldDebugger />,
    hidden: true
  },
  {
    name: 'Settings',
    path: '/settings',
    group: 0,
    element: <SettingsApp />
  }
];

export default AppRoutes;
