import { FC } from 'react';
import DrawerLayout from '../../layouts/DrawerLayout';
import AppRoutes from '../../AppRoutes';

const EventApp: FC = () => {
  return (
    <DrawerLayout routes={AppRoutes}>
      <div>I am the event manager app</div>
    </DrawerLayout>
  );
};

export default EventApp;
