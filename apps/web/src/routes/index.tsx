import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root.js';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome to ctrlpane. Select a section from the sidebar.</p>
    </div>
  );
}
