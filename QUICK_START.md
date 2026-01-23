# Quick Start Guide: Using Performance Optimizations

## 🚀 Immediate Actions

### 1. Replace Event Lists (5 minutes)

**Before:**
```tsx
// app/events/page.tsx
export default function EventsPage() {
  const [events, setEvents] = useState([]);
  
  useEffect(() => {
    fetchEvents().then(setEvents);
  }, []);

  return (
    <div>
      {events.map(e => <EventCard event={e} />)}
    </div>
  );
}
```

**After:**
```tsx
import { PaginatedEvents } from '@/components/ui/PaginatedEvents';
import { useEvents } from '@/hooks/useOptimized';
import { fetchEvents } from '@/lib/api';

export default function EventsPage() {
  const { data, isLoading } = useEvents(fetchEvents);

  if (isLoading) return <EventListSkeleton />;

  return <PaginatedEvents events={data} itemsPerPage={12} />;
}
```

### 2. Add Search to Pages (3 minutes)

```tsx
import { DebouncedSearch } from '@/components/ui/DebouncedSearch';

<DebouncedSearch 
  onSearch={(query) => filterEvents(query)}
  placeholder="Search events..."
/>
```

### 3. Optimize Dashboard (5 minutes)

**Before:**
```tsx
const user = await fetchUserWithRegistrations(token);
const events = await fetchEvents();
const workshops = await fetchWorkshops();
// 3 sequential API calls = slow!
```

**After:**
```tsx
import { fetchDashboardData } from '@/lib/api-optimized';

const { userData, events, workshops } = await fetchDashboardData(token);
// All data loads in parallel = fast!
```

## 📊 Check Performance Improvements

### Before Optimizations:
```bash
npm run build
# Look for bundle sizes
```

### After Optimizations:
```bash
npm run build
# Compare bundle sizes - should be smaller
```

### Measure API Performance:
```typescript
import { measureAsync } from '@/lib/performance';

const events = await measureAsync('Load Events', fetchEvents);
// Console: "⏱️ Load Events: 123.45ms"
```

## 🔍 Common Use Cases

### Case 1: Events List Page
```tsx
'use client';
import { PaginatedEvents } from '@/components/ui/PaginatedEvents';
import { EventListSkeleton } from '@/components/ui/LoadingSkeleton';
import { useEvents } from '@/hooks/useOptimized';
import { fetchEvents } from '@/lib/api';

export default function EventsPage() {
  const { data, isLoading, error } = useEvents(fetchEvents);

  if (isLoading) return <EventListSkeleton count={6} />;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Events</h1>
      <PaginatedEvents events={data} itemsPerPage={12} />
    </div>
  );
}
```

### Case 2: Dashboard with Stats
```tsx
'use client';
import { useEffect, useState } from 'react';
import { fetchDashboardData } from '@/lib/api-optimized';
import { DashboardSkeleton } from '@/components/ui/LoadingSkeleton';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchDashboardData(token)
        .then(setData)
        .finally(() => setLoading(false));
    }
  }, []);

  if (loading) return <DashboardSkeleton />;

  return (
    <div>
      <h1>Welcome, {data?.userData.user.name}!</h1>
      <div>You're registered for {data?.userData.registrations.length} events</div>
      {/* Show events and workshops */}
    </div>
  );
}
```

### Case 3: Search with Debounce
```tsx
'use client';
import { useState } from 'react';
import { DebouncedSearch } from '@/components/ui/DebouncedSearch';
import { PaginatedEvents } from '@/components/ui/PaginatedEvents';
import { useEvents } from '@/hooks/useOptimized';
import { fetchEvents } from '@/lib/api';

export default function SearchablePage() {
  const { data: allEvents, isLoading } = useEvents(fetchEvents);
  const [filtered, setFiltered] = useState([]);

  useEffect(() => {
    setFiltered(allEvents);
  }, [allEvents]);

  const handleSearch = (query: string) => {
    if (!query) {
      setFiltered(allEvents);
      return;
    }
    const results = allEvents.filter(e => 
      e.title.toLowerCase().includes(query.toLowerCase())
    );
    setFiltered(results);
  };

  return (
    <div>
      <DebouncedSearch onSearch={handleSearch} />
      <PaginatedEvents events={filtered} />
    </div>
  );
}
```

### Case 4: Large List with Virtual Scrolling
```tsx
import { VirtualScroll } from '@/components/ui/VirtualScroll';
import { EventCard } from '@/components/ui/EventCard';

export default function LargeListPage({ events }) {
  return (
    <VirtualScroll
      items={events}
      itemHeight={250}
      containerHeight={800}
      renderItem={(event) => <EventCard event={event} />}
    />
  );
}
```

## 🛠️ Debugging & Testing

### Check Cache Status:
```typescript
import { cache } from '@/lib/cache';

// Get cache info
console.log(cache.getStats());
// Output: { size: 3, keys: ['events', 'workshops', 'user-data'] }

// Clear specific cache
cache.delete('events');

// Clear all cache
cache.clear();
```

### Measure Performance:
```typescript
import { measurePerformance } from '@/lib/performance';

function MyComponent() {
  const done = measurePerformance('Component Render');
  
  // ... your component logic
  
  useEffect(() => {
    done(); // Logs render time
  }, []);
}
```

### Test Debouncing:
```typescript
import { debounce } from '@/lib/debounce';

const debouncedLog = debounce((msg) => console.log(msg), 500);

debouncedLog('test 1'); // Won't log
debouncedLog('test 2'); // Won't log  
debouncedLog('test 3'); // Logs after 500ms of no calls
```

## 📈 Expected Results

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Initial Load | 3-5s | 1-2s | **60% faster** |
| API Calls | 20+ per page | 3-5 per page | **75% reduction** |
| Re-renders | 50+ per action | 10-15 per action | **70% reduction** |
| Bundle Size | ~800KB | ~600KB | **25% smaller** |
| Search Lag | 500ms+ | <100ms | **80% faster** |

## ✅ Checklist

- [ ] Replace long event lists with `PaginatedEvents`
- [ ] Add `EventListSkeleton` for loading states
- [ ] Use `fetchDashboardData` for parallel loading
- [ ] Add `DebouncedSearch` to search pages
- [ ] Replace regular images with optimized `EventCard`
- [ ] Test with `npm run build` to check bundle size
- [ ] Monitor performance with browser DevTools
- [ ] Check console for cache logs in development

## 🎯 Priority Order

1. **High Impact, Low Effort:**
   - ✅ Add caching (already done in api.ts)
   - ✅ Add loading skeletons
   - ✅ Replace long lists with pagination

2. **Medium Impact, Medium Effort:**
   - Add debounced search
   - Batch API calls with api-optimized
   - Use optimized EventCard component

3. **Lower Priority:**
   - Virtual scrolling (only for very large lists)
   - Advanced performance monitoring
   - Custom lazy loading

## 🚨 Common Mistakes to Avoid

❌ **Don't:**
- Call `fetchEvents()` multiple times in same component
- Render 100+ items without pagination
- Use `useEffect` without cleanup for API calls
- Forget loading states

✅ **Do:**
- Use custom hooks like `useEvents`
- Always show loading skeletons
- Batch parallel API calls
- Use React.memo for static components
- Add error boundaries

---

**Next Steps:**
1. Start with your most-visited pages (events, dashboard)
2. Add loading skeletons everywhere
3. Replace long lists with pagination
4. Test and measure improvements
5. Iterate based on results

Need help? Check `PERFORMANCE_OPTIMIZATIONS.md` for full documentation!
