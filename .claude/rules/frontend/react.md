# Frontend Rules — PostPilot

## React + TypeScript Standards

- All components are functional — zero class components
- Props are always typed with an explicit interface, never inlined
- Never use `any` — use `unknown` and narrow with type guards
- `useEffect` dependencies must be exhaustive — no suppressions
- State that changes together lives together (single `useState` with object, or `useReducer`)
- Never put API calls directly in components — always via custom hooks

### Component Template
```tsx
// frontend/src/components/ExampleCard.tsx
import { FC } from 'react';

interface ExampleCardProps {
  title: string;
  description: string;
  onAction: () => void;
}

const ExampleCard: FC<ExampleCardProps> = ({ title, description, onAction }) => {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
      <button
        onClick={onAction}
        className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-500"
      >
        Action
      </button>
    </div>
  );
};

export default ExampleCard;
```

---

## Routing Rules

- All routes defined in `App.tsx` using React Router v6
- Protected routes use `<ProtectedRoute>` wrapper that redirects to `/login` if not authenticated
- Route paths: `/`, `/composer`, `/calendar`, `/history`, `/settings`
- Never use `useNavigate` in components — pass navigation callbacks as props or use links
- Page components are lazy-loaded: `const Dashboard = lazy(() => import('./pages/Dashboard'))`

---

## Data Fetching (TanStack Query)

- Every API resource has a dedicated query key constant:
  ```typescript
  export const QUERY_KEYS = {
    posts: ['posts'] as const,
    post: (id: string) => ['posts', id] as const,
    accounts: ['accounts'] as const,
  };
  ```
- `useQuery` for reads, `useMutation` for writes
- Always handle `isLoading`, `isError`, and `data` states in UI
- On mutation success, invalidate related queries — never manually update cache
- Set `staleTime: 1000 * 60` (1 minute) for social accounts (rarely change)

### Hook Template
```typescript
// frontend/src/hooks/usePosts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPosts, createPost } from '../lib/api/posts';
import { QUERY_KEYS } from '../lib/queryKeys';

export function usePosts() {
  return useQuery({
    queryKey: QUERY_KEYS.posts,
    queryFn: fetchPosts,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts });
    },
  });
}
```

---

## Forms (React Hook Form + Zod)

- All forms use `react-hook-form` with `zodResolver`
- Schema defined in the same file as the form component (or imported from `types/`)
- Always show field-level error messages below each input
- Submit button disabled while `isSubmitting` is true
- After successful submit: reset form AND show success toast

### Form Template
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  content: z.string().min(1, 'Required').max(2200, 'Too long'),
});

type FormData = z.infer<typeof schema>;

function PostForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });
  // ...
}
```

---

## State Management (Zustand)

- Zustand stores live in `src/store/`
- One store per domain: `authStore.ts`, never a single giant store
- Store actions are methods on the store, not separate functions
- Persist auth state to localStorage with `persist` middleware

---

## Tailwind CSS Rules

- Use Tailwind utility classes — no custom CSS files (except `index.css` for base)
- Color palette: indigo for primary actions, gray for neutral, red for errors, green for success
- Responsive breakpoints: `sm:` (640px), `md:` (768px), `lg:` (1024px)
- Dark mode is NOT in scope for MVP — skip `dark:` variants
- Loading states use `animate-pulse` skeleton divs, not spinners (except for button states)
- Error states use red-50 background + red-600 text

### Design Tokens
```
Primary: indigo-600 / indigo-700 (hover)
Background: gray-50 (page), white (cards)
Border: gray-200
Text primary: gray-900
Text secondary: gray-500
Success: green-600
Error: red-600
Warning: amber-600
```

---

## Accessibility

- Every interactive element has a `aria-label` if no visible text
- Images have meaningful `alt` text — never empty alt on informational images
- Form inputs have associated `<label>` elements (not just placeholder)
- Keyboard navigation works for all flows
- Focus rings must be visible — never `outline-none` without a replacement

---

## Performance Rules

- Images use `loading="lazy"` attribute
- Components that aren't in the initial viewport are lazy-loaded
- Never import entire icon libraries — import individual icons from `lucide-react`
- Avoid re-renders: memoize expensive calculations with `useMemo`, callback props with `useCallback`
- Supabase Realtime subscription is set up once in a layout component, not per-page
