import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from '../__root.js';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div>
      <h1>Settings</h1>
      <p>Application settings will be rendered here.</p>
    </div>
  );
}
