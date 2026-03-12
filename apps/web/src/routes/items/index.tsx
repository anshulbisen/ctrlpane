import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from '../__root.js';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/items',
  component: ItemsPage,
});

function ItemsPage() {
  return (
    <div>
      <h1>Items</h1>
      <p>Item list will be rendered here.</p>
    </div>
  );
}
