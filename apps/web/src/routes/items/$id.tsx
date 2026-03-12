import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from '../__root.js';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/items/$id',
  component: ItemDetailPage,
});

function ItemDetailPage() {
  const { id } = Route.useParams();
  return (
    <div>
      <h1>Item Detail</h1>
      <p>Viewing item: {id}</p>
    </div>
  );
}
