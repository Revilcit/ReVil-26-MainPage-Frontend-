# ReVil 2026 Frontend

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 🚀 Performance Optimizations

This project includes comprehensive performance optimizations:
- ✅ **Caching System** - 5-minute cache for API calls
- ✅ **Lazy Loading** - Images and components load on demand
- ✅ **Pagination** - Efficient rendering of large lists
- ✅ **Debouncing** - Optimized search and input handling
- ✅ **React.memo** - Smart component re-rendering
- ✅ **Batch Loading** - Parallel API requests

**📖 See [OPTIMIZATION_COMPLETE.md](OPTIMIZATION_COMPLETE.md) for full details**
**🚀 See [QUICK_START.md](QUICK_START.md) for quick implementation guide**

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## 📦 Project Structure

```
src/
├── app/                    # Next.js app routes
├── components/
│   ├── ui/                # Optimized UI components
│   │   ├── EventCard.tsx         # React.memo optimized
│   │   ├── PaginatedEvents.tsx   # Pagination
│   │   ├── LoadingSkeleton.tsx   # Loading states
│   │   ├── DebouncedSearch.tsx   # Debounced search
│   │   ├── LazyImage.tsx         # Lazy loading
│   │   └── VirtualScroll.tsx     # Virtual scrolling
│   └── ErrorBoundary.tsx  # Error handling
├── lib/
│   ├── cache.ts           # Caching system
│   ├── debounce.ts        # Debounce/throttle
│   ├── performance.ts     # Performance monitoring
│   ├── api.ts             # API functions (cached)
│   └── api-optimized.ts   # Batch API calls
├── hooks/
│   └── useOptimized.ts    # Custom performance hooks
└── types/
    └── api.ts             # TypeScript types
```

## 🎯 Quick Usage Examples

### Paginated Event List
```tsx
import { PaginatedEvents } from '@/components';
import { useEvents } from '@/hooks';
import { fetchEvents } from '@/lib';

export default function Page() {
  const { data, isLoading } = useEvents(fetchEvents);
  return <PaginatedEvents events={data} itemsPerPage={12} />;
}
```

### Debounced Search
```tsx
import { DebouncedSearch } from '@/components';

<DebouncedSearch 
  onSearch={handleSearch}
  placeholder="Search..."
/>
```

### Batch API Calls
```typescript
import { fetchDashboardData } from '@/lib';

const { userData, events, workshops } = await fetchDashboardData(token);
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
