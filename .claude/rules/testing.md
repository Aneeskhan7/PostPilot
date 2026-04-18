# Testing Rules — PostPilot

## Testing Philosophy

- Every service function has at least one unit test
- Every API route has integration tests for: success path, auth failure, validation failure, not-found
- Frontend: test hooks and business logic — not CSS or layout
- Tests run before every commit (husky pre-commit hook)

---

## Backend Testing (Vitest)

### Setup
```bash
cd backend
npm install -D vitest @vitest/coverage-v8 supertest @types/supertest msw
```

### Test File Location
```
backend/src/
├── routes/
│   ├── posts.ts
│   └── posts.test.ts      ← test lives next to the file it tests
├── services/
│   ├── meta.ts
│   └── meta.test.ts
```

### Route Test Template
```typescript
// backend/src/routes/posts.test.ts
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import app from '../index';

// Mock Supabase
vi.mock('../db/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: mockPost, error: null }),
  },
}));

const mockPost = { id: 'test-id', content: 'Test post', status: 'draft' };
const authHeader = { Authorization: 'Bearer valid-test-token' };

describe('POST /api/posts', () => {
  it('creates a post successfully', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set(authHeader)
      .send({ content: 'Hello world', platforms: ['instagram'] });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('id');
  });

  it('returns 401 without auth header', async () => {
    const res = await request(app).post('/api/posts').send({ content: 'Test' });
    expect(res.status).toBe(401);
  });

  it('returns 400 with invalid body', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set(authHeader)
      .send({ content: '' }); // empty content fails Zod
    expect(res.status).toBe(400);
  });
});
```

---

## Frontend Testing (Vitest + React Testing Library)

### Setup
```bash
cd frontend
npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

### Hook Test Template
```typescript
// frontend/src/hooks/usePosts.test.ts
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePosts } from './usePosts';
import * as postsApi from '../lib/api/posts';

vi.mock('../lib/api/posts');

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>
    {children}
  </QueryClientProvider>
);

it('fetches posts successfully', async () => {
  vi.mocked(postsApi.fetchPosts).mockResolvedValue([
    { id: '1', content: 'Test', status: 'draft' }
  ]);

  const { result } = renderHook(() => usePosts(), { wrapper });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toHaveLength(1);
});
```

---

## What to Test (Checklist)

### Backend — for each route
- [ ] 200/201 success with valid input
- [ ] 401 when no Authorization header
- [ ] 401 when token is expired/invalid
- [ ] 403 when accessing another user's resource
- [ ] 400 when request body fails Zod validation
- [ ] 404 when resource doesn't exist
- [ ] 422 when free plan limit is reached (post creation)

### Backend — for each service
- [ ] Happy path returns expected data
- [ ] API errors are handled and re-thrown with context
- [ ] Token decryption errors don't crash the app

### Frontend — for each hook
- [ ] Loading state is `true` initially
- [ ] Data is populated after successful fetch
- [ ] Error state is set on API failure
- [ ] Mutation invalidates correct query keys

---

## Running Tests

```bash
# Backend
cd backend && npx vitest run              # single run
cd backend && npx vitest                  # watch mode
cd backend && npx vitest run --coverage   # coverage report

# Frontend
cd frontend && npx vitest run
cd frontend && npx vitest run --coverage

# Full project (from root)
npm run test --workspaces
```

## Coverage Targets

| Layer | Target |
|---|---|
| Backend services | 80% |
| Backend routes | 70% |
| Frontend hooks | 75% |
| Frontend components | 50% (happy path only for MVP) |
