import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from '../__root.js';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tags',
  component: TagsPage,
});

function TagsPage() {
  return (
    <div>
      <h1>Tags</h1>
      <p>Tag management will be rendered here.</p>
    </div>
  );
}
