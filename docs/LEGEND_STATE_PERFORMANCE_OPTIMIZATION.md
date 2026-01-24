# Advanced Legend State Performance Optimization Guide

## Table of Contents
1. [Computed Observables - The Secret Weapon](#computed-observables)
2. [Observable Memoization & Caching](#memoization-strategies)
3. [Batch Updates & State Batching](#batch-updates)
4. [Array Optimizations Beyond `<For>`](#array-optimizations)
5. [Observable Lifecycle Management](#lifecycle-management)
6. [Performance Debugging & Profiling](#debugging)
7. [Advanced State Patterns](#advanced-patterns)
8. [Real-World AI Stickies Examples](#real-world-examples)
9. [Memory Optimization Techniques](#memory-optimization)
10. [Performance Metrics & Benchmarks](#metrics)

---

## Computed Observables - The Secret Weapon

Computed observables are the most powerful performance tool in Legend State. They cache derived values and only recompute when dependencies change.

### Basic Computed Pattern

```typescript
import { observable, computed } from '@legendapp/state';

const generationState$ = observable({
  previews: [] as StylePreview[],
  selectedStyleIds: [] as string[],
  isGenerating: false,
  progress: 0
});

// BAD - Recalculates on every render
const isComplete = generationState$.previews.length === 5;

// GOOD - Computed with caching
const isComplete$ = computed(() => 
  generationState$.previews.get().length === 5
);

// Use in component
const MyComponent = observer(() => {
  return (
    <Show if={isComplete$}>
      <CompleteSteps />
    </Show>
  );
});
```

### Chain Computed Observables

```typescript
// Create a computation chain
const allPreviews$ = computed(() => 
  generationState$.previews.get()
);

const completedPreviews$ = computed(() => 
  allPreviews$.get().filter(p => p.status === 'completed')
);

const completionPercentage$ = computed(() => 
  Math.round((completedPreviews$.get().length / 5) * 100)
);

const progressText$ = computed(() => 
  `${completionPercentage$.get()}% complete`
);

// Each computed only recalculates when its specific dependencies change
const StatusDisplay = observer(() => {
  return (
    <div>
      <Memo>{progressText$}</Memo>
    </div>
  );
});
```

### Optimizing Expensive Computations

```typescript
import { computed, observable } from '@legendapp/state';

const stickerPack$ = observable({
  stickers: [] as Sticker[]
});

// BAD - Recalculates entire array on every sticker change
const totalSizeBytes$ = computed(() => {
  return stickerPack$.stickers.get().reduce((sum, sticker) => {
    return sum + sticker.sizeBytes;
  }, 0);
});

// GOOD - Use peek for selective dependency tracking
const totalSizeBytes$ = computed(() => {
  const stickers = stickerPack$.stickers.peek(); // Track array changes
  return stickers.reduce((sum, sticker) => {
    return sum + sticker.sizeBytes; // Doesn't track individual sticker.sizeBytes
  }, 0);
});

// BETTER - If you need individual sticker tracking, use memoization
const stickerSizes$ = computed(() => 
  new Map(
    stickerPack$.stickers.get().map(s => [s.id, s.sizeBytes])
  )
);

const totalSizeBytes$ = computed(() => {
  const sizes = stickerSizes$.get();
  return Array.from(sizes.values()).reduce((a, b) => a + b, 0);
});
```

### Computed with Async Operations

```typescript
import { observable, computed } from '@legendapp/state';

const uploadState$ = observable({
  file: null as File | null,
  previewUrl: '',
  isProcessing: false
});

// Async computed - caches the Promise
const imageDimensions$ = computed(async () => {
  const file = uploadState$.file.peek();
  if (!file) return null;
  
  return new Promise<{ width: number; height: number }>((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.src = URL.createObjectURL(file);
  });
});

// Use in component
const ImageInfo = observer(() => {
  // Automatically handles async state
  return (
    <Memo>{() => {
      const dims = imageDimensions$.get();
      return dims ? `${dims.width}x${dims.height}` : 'Loading...';
    }}</Memo>
  );
});
```

---

## Observable Memoization & Caching

### Memoize Expensive Operations

```typescript
import { observable, computed, memo } from '@legendapp/state';

const generationState$ = observable({
  prompts: {} as Record<string, string>,
  stylePreviews: [] as StylePreview[]
});

// Memoize prompt generation - only regenerate when inputs change
const generatePrompt$ = memo((style: string, emotion: string) => {
  return computed(() => {
    const basePrompt = generationState$.prompts.base.peek();
    return `${basePrompt} ${style} ${emotion}`;
  });
});

// Usage
const happyPrompt$ = generatePrompt$('chibi', 'happy');
const sadPrompt$ = generatePrompt$('chibi', 'sad');

// Both share the same basePrompt dependency, but cache independently
```

### Cache Observables by Key

```typescript
import { observable, computed } from '@legendapp/state';

const sessionCache = new Map<string, Observable<Session>>();

function getSession$(sessionId: string): Observable<Session> {
  if (sessionCache.has(sessionId)) {
    return sessionCache.get(sessionId)!;
  }
  
  const session$ = observable<Session>({
    id: sessionId,
    generations: []
  });
  
  sessionCache.set(sessionId, session$);
  return session$;
}

// Usage - cached across components
const MyComponent = observer(() => {
  const sessionId = useParams().id;
  const session$ = getSession$(sessionId);
  
  return (
    <div>
      <Memo>{() => session$.generations.length}</Memo> generations
    </div>
  );
});
```

### LRU Cache for Large Datasets

```typescript
class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;
  
  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }
  
  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;
    
    // Move to end (most recently used)
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }
  
  set(key: K, value: V): void {
    if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}

// Usage with observables
const stickerCache = new LRUCache<string, Observable<Sticker>>();

function getSticker$(id: string): Observable<Sticker> {
  const cached = stickerCache.get(id);
  if (cached) return cached;
  
  const sticker$ = observable<Sticker>(fetchSticker(id));
  stickerCache.set(id, sticker$);
  return sticker$;
}
```

---

## Batch Updates & State Batching

### Batch Multiple Updates

```typescript
import { observable, batch } from '@legendapp/state';

const generationState$ = observable({
  previews: [] as StylePreview[],
  progress: 0,
  status: 'idle' as GenerationStatus
});

// BAD - Causes 3 separate renders
generationState$.progress.set(50);
generationState$.status.set('processing');
generationState$.previews.push(newPreview);

// GOOD - Single render
batch(() => {
  generationState$.progress.set(50);
  generationState$.status.set('processing');
  generationState$.previews.push(newPreview);
});

// BETTER - Use batch for complex transformations
batch(() => {
  const newPreviews = [...generationState$.previews.peek()];
  newPreviews.forEach(p => p.status = 'completed');
  generationState$.previews.set(newPreviews);
  generationState$.progress.set(100);
  generationState$.status.set('completed');
});
```

### Batch in Event Handlers

```typescript
const GenerateButton = observer(() => {
  const handleClick = () => {
    batch(() => {
      // All state updates happen together
      generationState$.isGenerating.set(true);
      generationState$.progress.set(0);
      generationState$.selectedStyleIds.set([]);
      
      // Start generation
      startGeneration();
    });
  };
  
  return <button onClick={handleClick}>Generate</button>;
});
```

### Batch with Async Operations

```typescript
import { observable, batch } from '@legendapp/state';

async function generateAllPreviews() {
  // Initial batch
  batch(() => {
    generationState$.isGenerating.set(true);
    generationState$.progress.set(0);
  });
  
  const styles = ['chibi', 'minimalist', 'abstract', 'high-fidelity', 'stylized'];
  const results = await Promise.all(
    styles.map(style => generatePreview(style))
  );
  
  // Final batch
  batch(() => {
    generationState$.previews.set(results);
    generationState$.progress.set(100);
    generationState$.isGenerating.set(false);
  });
}
```

---

## Array Optimizations Beyond `<For>`

### Virtual Scrolling for Large Lists

```typescript
import { observable, useObservable } from '@legendapp/state/react';
import { For } from '@legendapp/state/react';

const largeListState$ = observable({
  items: [] as Item[],
  visibleStart: 0,
  visibleEnd: 20
});

const VirtualizedList = observer(() => {
  const containerRef$ = useObservable<HTMLDivElement | null>(null);
  
  const handleScroll = () => {
    const container = containerRef$.get();
    if (!container) return;
    
    const scrollTop = container.scrollTop;
    const itemHeight = 50;
    const windowHeight = container.clientHeight;
    
    batch(() => {
      largeListState$.visibleStart.set(
        Math.floor(scrollTop / itemHeight)
      );
      largeListState$.visibleEnd.set(
        Math.ceil((scrollTop + windowHeight) / itemHeight)
      );
    });
  };
  
  const visibleItems$ = computed(() => {
    const items = largeListState$.items.peek();
    const { visibleStart, visibleEnd } = largeListState$.peek();
    return items.slice(visibleStart, visibleEnd);
  });
  
  return (
    <div
      ref={containerRef$.set}
      onScroll={handleScroll}
      style={{ height: '400px', overflow: 'auto' }}
    >
      <For each={visibleItems$}>
        {(item$) => (
          <div style={{ height: '50px' }}>
            <Memo>{item$.name}</Memo>
          </div>
        )}
      </For>
    </div>
  );
});
```

### Optimized Array Transforms

```typescript
import { observable, computed } from '@legendapp/state';

const packs$ = observable({
  packs: [] as StickerPack[],
  sortBy: 'createdAt' as 'createdAt' | 'size' | 'name',
  filter: '' as string
});

// BAD - Recalculates entire sort on every pack change
const sortedPacks$ = computed(() => {
  return packs$.packs.get()
    .filter(p => p.name.includes(packs$.filter.peek()))
    .sort((a, b) => {
      if (packs$.sortBy.peek() === 'createdAt') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (packs$.sortBy.peek() === 'size') {
        return b.sizeBytes - a.sizeBytes;
      }
      return a.name.localeCompare(b.name);
    });
});

// GOOD - Separate computation steps
const filteredPacks$ = computed(() => {
  const packs = packs$.packs.peek();
  const filter = packs$.filter.peek();
  return filter
    ? packs.filter(p => p.name.includes(filter))
    : [...packs];
});

const sortedPacks$ = computed(() => {
  const packs = filteredPacks$.get(); // Tracked dependency
  const sortBy = packs$.sortBy.peek(); // Tracked dependency
  
  return [...packs].sort((a, b) => {
    if (sortBy === 'createdAt') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === 'size') {
      return b.sizeBytes - a.sizeBytes;
    }
    return a.name.localeCompare(b.name);
  });
});
```

### Optimized Array Operations

```typescript
import { observable, computed } from '@legendapp/state';

const pack$ = observable({
  stickers: [] as Sticker[]
});

// Use peek for non-reactive array operations
const addSticker = (sticker: Sticker) => {
  // peek() prevents tracking individual sticker properties
  const stickers = pack$.stickers.peek();
  const newStickers = [...stickers, sticker];
  pack$.stickers.set(newStickers);
};

// Use set for bulk updates
const updateMultipleStickers = (updates: Partial<Sticker>[]) => {
  const stickers = pack$.stickers.peek();
  const newStickers = stickers.map((sticker, index) => ({
    ...sticker,
    ...updates[index]
  }));
  pack$.stickers.set(newStickers);
};

// Use assign for object updates
const updateSticker = (id: string, updates: Partial<Sticker>) => {
  const index = pack$.stickers.peek().findIndex(s => s.id === id);
  if (index !== -1) {
    pack$.stickers[index].assign(updates);
  }
};
```

---

## Observable Lifecycle Management

### Dispose Unused Observables

```typescript
import { observable, computed, onDispose } from '@legendapp/state';

function createObservableResource<T>(
  fetcher: () => Promise<T>
): Observable<T | null> {
  const data$ = observable<T | null>(null);
  const isLoading$ = observable(true);
  
  // Fetch data
  fetcher().then(data => {
    data$.set(data);
    isLoading$.set(false);
  });
  
  // Cleanup on dispose
  onDispose(() => {
    console.log('Disposing observable resource');
    // Cancel pending requests, clear large caches, etc.
  });
  
  return data$;
}

// Usage
const StickerPackView = observer(({ packId }: { packId: string }) => {
  const pack$ = useMemo(
    () => createObservableResource(() => fetchPack(packId)),
    [packId]
  );
  
  return (
    <Show if={pack$}>
      {(pack$) => <PackDetails pack$={pack$} />}
    </Show>
  );
});
```

### Cleanup Event Listeners

```typescript
import { observable, observer, onMount, onDispose } from '@legendapp/state/react';

const ImageUploader = observer(() => {
  const isDragging$ = useObservable(false);
  
  onMount(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      isDragging$.set(true);
    };
    
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      isDragging$.set(false);
    };
    
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('dragleave', handleDragLeave);
    
    // Cleanup on unmount
    onDispose(() => {
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('dragleave', handleDragLeave);
    });
  });
  
  return (
    <div className={isDragging$.get() ? 'dragging' : ''}>
      Drop zone
    </div>
  );
});
```

### Weak References for Large Objects

```typescript
import { observable } from '@legendapp/state';
import { WeakRef } from '@harmony-js/weak-ref'; // Or native WeakRef

const imageCache$ = observable(new Map<string, WeakRef<HTMLImageElement>>());

function getCachedImage$(url: string): Observable<HTMLImageElement | null> {
  const cached = imageCache$.get().get(url)?.deref();
  if (cached) {
    return observable(cached);
  }
  
  const img$ = observable<HTMLImageElement | null>(null);
  const img = new Image();
  
  img.onload = () => {
    img$.set(img);
    imageCache$.set(new Map(imageCache$.get()).set(url, new WeakRef(img)));
  };
  
  img.src = url;
  return img$;
}
```

---

## Performance Debugging & Profiling

### Track Observable Access

```typescript
import { observable, peek, isObservable } from '@legendapp/state';

// Debug wrapper to track observable access
function debugObservable<T>(name: string, obs$: Observable<T>): Observable<T> {
  const handler = {
    get(target: any, prop: any) {
      const value = Reflect.get(target, prop);
      
      if (typeof value === 'function' && value.name === 'get') {
        return function(this: any, ...args: any[]) {
          console.log(`[Observable ${name}] Accessing:`, prop);
          return value.apply(this, args);
        };
      }
      
      return value;
    }
  };
  
  return new Proxy(obs$, handler);
}

// Usage
const sessionState$ = debugObservable('session', observable({
  id: '',
  generations: []
}));
```

### Profile Render Performance

```typescript
import { observer, useObservable } from '@legendapp/state/react';

const PerformanceProfiler = observer(({ children }: { children: React.ReactNode }) => {
  const renderCount$ = useObservable(0);
  const lastRenderTime$ = useObservable(Date.now());
  
  renderCount$.set(renderCount$.get() + 1);
  lastRenderTime$.set(Date.now());
  
  return (
    <>
      <div className="debug-info">
        Renders: <Memo>{renderCount$}</Memo>
        Last render: <Memo>{() => {
          const now = Date.now();
          const last = lastRenderTime$.get();
          return `${now - last}ms ago`;
        }}</Memo>
      </div>
      {children}
    </>
  );
});

// Wrap components to profile them
<PerformanceProfiler>
  <StickerPackList />
</PerformanceProfiler>
```

### Debug Computed Dependencies

```typescript
import { computed, observable } from '@legendapp/state';

function createDebugComputed<T>(
  name: string,
  fn: () => T
): Observable<T> {
  const computed$ = computed(fn);
  
  // Track when computed recalcuates
  const originalGet = computed$.get.bind(computed$);
  computed$.get = function() {
    const start = performance.now();
    const result = originalGet();
    const end = performance.now();
    
    console.log(`[Computed ${name}] Recalculated in ${(end - start).toFixed(2)}ms`);
    return result;
  };
  
  return computed$;
}

// Usage
const expensiveComputation$ = createDebugComputed('packStats', () => {
  // Expensive calculation
  return calculatePackStats();
});
```

### Visualize Observable Updates

```typescript
import { observable, observer, reactive } from '@legendapp/state/react';
import clsx from 'clsx';

const ObservableHighlighter = observer(({ 
  children, 
  name 
}: { 
  children: React.ReactNode
  name: string 
}) => {
  const updateCount$ = useObservable(0);
  const isUpdating$ = useObservable(false);
  
  updateCount$.set(updateCount$.get() + 1);
  isUpdating$.set(true);
  
  setTimeout(() => isUpdating$.set(false), 100);
  
  return (
    <div 
      className={clsx(
        'transition-colors duration-100',
        isUpdating$.get() ? 'bg-yellow-100' : 'bg-transparent'
      )}
      title={`${name}: ${updateCount$.get()} updates`}
    >
      {children}
    </div>
  );
});

// Wrap observables to see update frequency
<ObservableHighlighter name="sessionInfo">
  <SessionInfo />
</ObservableHighlighter>
```

---

## Advanced State Patterns

### Observable State Machine

```typescript
type State = 
  | { type: 'idle' }
  | { type: 'uploading'; progress: number }
  | { type: 'generating'; step: number; total: number }
  | { type: 'completed' }
  | { type: 'error'; message: string };

const workflowState$ = observable<State>({ type: 'idle' });

// Computed helpers
const isIdle$ = computed(() => workflowState$.get().type === 'idle');
const isLoading$ = computed(() => 
  workflowState$.get().type === 'uploading' || 
  workflowState$.get().type === 'generating'
);
const progress$ = computed(() => {
  const state = workflowState$.get();
  if (state.type === 'uploading') return state.progress;
  if (state.type === 'generating') return (state.step / state.total) * 100;
  return 0;
});

// Usage
const WorkflowStatus = observer(() => {
  return (
    <Show if={isLoading$}>
      <ProgressBar progress={progress$} />
    </Show>
  );
});
```

### Observable Store Pattern

```typescript
import { observable, computed } from '@legendapp/state';

class StickerStore {
  readonly packs$ = observable<StickerPack[]>([]);
  readonly selectedPackId$ = observable<string | null>(null);
  
  readonly selectedPack$ = computed(() => {
    const id = this.selectedPackId$.peek();
    if (!id) return null;
    return this.packs$.get().find(p => p.id === id) || null;
  });
  
  readonly totalStickers$ = computed(() => {
    return this.packs$.get().reduce((sum, pack) => 
      sum + pack.stickers.length, 0
    );
  });
  
  addPack(pack: StickerPack) {
    this.packs$.push(pack);
  }
  
  selectPack(id: string) {
    this.selectedPackId$.set(id);
  }
  
  removePack(id: string) {
    const index = this.packs$.peek().findIndex(p => p.id === id);
    if (index !== -1) {
      this.packs$.splice(index, 1);
    }
  }
}

// Singleton store
export const stickerStore = new StickerStore();

// Usage
const PackList = observer(() => {
  return (
    <For each={stickerStore.packs$}>
      {(pack$) => <PackCard pack$={pack$} />}
    </For>
  );
});
```

### Observable Async Queue

```typescript
import { observable, computed } from '@legendapp/state';

interface QueueItem<T> {
  id: string;
  data: T;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

class AsyncQueue<T> {
  readonly items$ = observable<QueueItem<T>[]>([]);
  readonly isProcessing$ = observable(false);
  readonly status$ = computed(() => {
    const items = this.items$.peek();
    const total = items.length;
    const completed = items.filter(i => i.status === 'completed').length;
    const failed = items.filter(i => i.status === 'failed').length;
    const processing = items.filter(i => i.status === 'processing').length;
    
    return { total, completed, failed, processing };
  });
  
  async add(item: T, processor: (data: T) => Promise<any>): Promise<any> {
    const id = Math.random().toString(36).substr(2, 9);
    this.items$.push({ id, data, status: 'pending' });
    
    this.processQueue();
    
    return new Promise((resolve, reject) => {
      const checkResult = () => {
        const item = this.items$.get().find(i => i.id === id);
        if (item?.status === 'completed') {
          resolve(item.result);
        } else if (item?.status === 'failed') {
          reject(new Error(item.error));
        } else {
          setTimeout(checkResult, 100);
        }
      };
      checkResult();
    });
  }
  
  private async processQueue() {
    if (this.isProcessing$.peek()) return;
    
    const pending = this.items$.peek().find(i => i.status === 'pending');
    if (!pending) return;
    
    this.isProcessing$.set(true);
    
    try {
      // Update status to processing
      const index = this.items$.peek().findIndex(i => i.id === pending.id);
      this.items$[index].status.set('processing');
      
      // Process item
      const result = await this.processItem(pending.data);
      
      // Update status to completed
      this.items$[index].assign({ status: 'completed', result });
    } catch (error) {
      // Update status to failed
      this.items$[index].assign({ 
        status: 'failed', 
        error: error.message 
      });
    } finally {
      this.isProcessing$.set(false);
      this.processQueue();
    }
  }
  
  protected async processItem(data: T): Promise<any> {
    throw new Error('processItem must be implemented');
  }
}

// Usage
class ImageGenerationQueue extends AsyncQueue<GenerationRequest> {
  constructor(private generator: ImageGenerator) {
    super();
  }
  
  protected async processItem(request: GenerationRequest): Promise<StickerPack> {
    return this.generator.generate(request);
  }
}
```

---

## Real-World AI Stickies Examples

### Optimized Generation Progress Tracking

```typescript
import { observable, computed, batch } from '@legendapp/state';

interface GenerationStep {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  startedAt?: number;
  completedAt?: number;
}

const generationState$ = observable({
  steps: [] as GenerationStep[],
  overallProgress: 0,
  isComplete: false
});

// Computed helpers
const currentStep$ = computed(() => 
  generationState$.steps.get().find(s => s.status === 'processing') || null
);

const allStepsCompleted$ = computed(() => 
  generationState$.steps.get().every(s => s.status === 'completed' || s.status === 'failed')
);

// Update progress efficiently
function updateStepProgress(stepId: string, progress: number) {
  const steps = generationState$.steps.peek();
  const stepIndex = steps.findIndex(s => s.id === stepId);
  
  if (stepIndex !== -1) {
    batch(() => {
      generationState$.steps[stepIndex].progress.set(progress);
      
      // Recalculate overall progress
      const totalProgress = steps.reduce((sum, step) => 
        sum + (step.progress / steps.length), 0
      );
      generationState$.overallProgress.set(Math.round(totalProgress));
      
      // Mark complete if all steps done
      if (allStepsCompleted$.get()) {
        generationState$.isComplete.set(true);
      }
    });
  }
}

// Optimized component
const GenerationProgress = observer(() => {
  const overallProgress = generationState$.overallProgress.get();
  const currentStep = currentStep$.get();
  
  return (
    <div>
      <ProgressBar progress={overallProgress} />
      <Show if={currentStep}>
        <Memo>{() => `${currentStep.name}: ${currentStep.progress}%`}</Memo>
      </Show>
    </div>
  );
});
```

### Optimized Sticker Pack Grid

```typescript
import { observable, computed, useObservable, observer, For, Memo } from '@legendapp/state/react';

const packState$ = observable({
  packs: [] as StickerPack[],
  selectedPackId: null as string | null,
  sortBy: 'createdAt' as 'createdAt' | 'name' | 'size',
  viewMode: 'grid' as 'grid' | 'list'
});

// Computed sorted and filtered packs
const displayPacks$ = computed(() => {
  const packs = packState$.packs.peek();
  const sortBy = packState$.sortBy.peek();
  
  return [...packs].sort((a, b) => {
    if (sortBy === 'createdAt') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'size') {
      return b.sizeBytes - a.sizeBytes;
    }
    return 0;
  });
});

// Optimized grid component
const PackGrid = observer(() => {
  const packs$ = displayPacks$;
  const viewMode = packState$.viewMode.peek();
  
  return (
    <div className={viewMode === 'grid' ? 'grid grid-cols-3 gap-4' : 'flex flex-col gap-2'}>
      <For each={packs$}>
        {(pack$) => (
          <PackCard 
            pack$={pack$}
            isSelected={computed(() => 
              packState$.selectedPackId.peek() === pack$.id.peek()
            )}
            onSelect={() => packState$.selectedPackId.set(pack$.id.peek())}
          />
        )}
      </For>
    </div>
  );
});

// Optimized card component
const PackCard = observer(({ 
  pack$, 
  isSelected$, 
  onSelect 
}: { 
  pack$: Observable<StickerPack>
  isSelected$: Observable<boolean>
  onSelect: () => void 
}) => {
  const pack = pack$.peek();
  const isSelected = isSelected$.peek();
  
  return (
    <div 
      onClick={onSelect}
      className={isSelected ? 'selected' : ''}
    >
      <Memo>{pack.name}</Memo>
      <Memo>{() => `${pack.stickers.length} stickers`}</Memo>
      <Memo>{() => formatBytes(pack.sizeBytes)}</Memo>
    </div>
  );
});
```

### Optimized Real-time Generation Updates

```typescript
import { observable, computed, observer, Reactive, Memo } from '@legendapp/state/react';

const realtimeGeneration$ = observable({
  isGenerating: false,
  currentStickerIndex: 0,
  totalStickers: 10,
  generatedPreviews: [] as string[],
  generatedStickers: [] as string[],
  errors: [] as string[]
});

// Computed progress
const generationProgress$ = computed(() => {
  const current = realtimeGeneration$.currentStickerIndex.peek();
  const total = realtimeGeneration$.totalStickers.peek();
  return Math.round((current / total) * 100);
});

// Computed status
const generationStatus$ = computed(() => {
  if (!realtimeGeneration$.isGenerating.peek()) return 'idle';
  if (realtimeGeneration$.errors.peek().length > 0) return 'errors';
  return 'generating';
});

// Optimized SSE handler
function setupGenerationUpdates() {
  const eventSource = new EventSource('/api/generate/stream');
  
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    batch(() => {
      switch (data.type) {
        case 'start':
          realtimeGeneration$.isGenerating.set(true);
          realtimeGeneration$.currentStickerIndex.set(0);
          break;
          
        case 'preview':
          realtimeGeneration$.generatedPreviews.push(data.url);
          realtimeGeneration$.currentStickerIndex.set(data.index);
          break;
          
        case 'sticker':
          realtimeGeneration$.generatedStickers.push(data.url);
          realtimeGeneration$.currentStickerIndex.set(data.index);
          break;
          
        case 'complete':
          realtimeGeneration$.isGenerating.set(false);
          realtimeGeneration$.currentStickerIndex.set(
            realtimeGeneration$.totalStickers.peek()
          );
          break;
          
        case 'error':
          realtimeGeneration$.errors.push(data.message);
          break;
      }
    });
  };
  
  return () => eventSource.close();
}

// Optimized display component
const RealtimeGenerationDisplay = observer(() => {
  const status = generationStatus$.get();
  const progress = generationProgress$.get();
  const previews = realtimeGeneration$.generatedPreviews.get();
  
  return (
    <Reactive.div className="generation-display">
      <Show if={() => status === 'generating'}>
        <ProgressBar progress={progress} />
        <div className="preview-grid">
          <For each={previews}>
            {(url$) => (
              <img src={url$.get()} alt="Preview" />
            )}
          </For>
        </div>
      </Show>
      
      <Show if={() => status === 'errors'}>
        <div className="errors">
          <For each={realtimeGeneration$.errors}>
            {(error$) => (
              <Memo>{error$}</Memo>
            )}
          </For>
        </div>
      </Show>
    </Reactive.div>
  );
});
```

---

## Memory Optimization Techniques

### Dispose Unused Computed Observables

```typescript
import { computed, observable } from '@legendapp/state';

class DisposableComputed {
  private disposables: (() => void)[] = [];
  
  createComputed<T>(fn: () => T): Observable<T> {
    const obs$ = computed(fn);
    this.disposables.push(() => {
      // Force disposal
      obs$.peek(); // Trigger last access
    });
    return obs$;
  }
  
  dispose() {
    this.disposables.forEach(dispose => dispose());
    this.disposables = [];
  }
}

// Usage
const computedManager = new DisposableComputed();
const packStats$ = computedManager.createComputed(() => calculatePackStats());

// Cleanup when done
computedManager.dispose();
```

### Lazy Observable Initialization

```typescript
import { observable } from '@legendapp/state';

const lazyPackState$ = observable({
  _packs: null as () => Observable<StickerPack[]> | null,
  get packs() {
    if (!this._packs) {
      this._packs = () => observable<StickerPack[]>([]);
    }
    return this._packs();
  }
});

// Usage - only initializes when accessed
const packs = lazyPackState$.packs; // Initialized here
```

### WeakMap for Temporary Observables

```typescript
import { observable } from '@legendapp/state';

const temporaryObservables = new WeakMap<object, Observable<any>>();

function getTemporaryObservable<T>(key: object, factory: () => Observable<T>): Observable<T> {
  const existing = temporaryObservables.get(key);
  if (existing) return existing as Observable<T>;
  
  const obs$ = factory();
  temporaryObservables.set(key, obs$);
  return obs$;
}

// Usage
const key = {};
const tempObs$ = getTemporaryObservable(key, () => observable({ data: [] }));

// When key is garbage collected, the observable can be collected too
```

---

## Performance Metrics & Benchmarks

### Track Observable Update Times

```typescript
import { observable, peek } from '@legendapp/state';

class ObservableProfiler {
  private updates = new Map<string, number[]>();
  
  track<T>(name: string, obs$: Observable<T>): Observable<T> {
    const handler = {
      get(target: any, prop: any) {
        const value = Reflect.get(target, prop);
        
        if (typeof value === 'function' && value.name === 'set') {
          return function(this: any, ...args: any[]) {
            const start = performance.now();
            const result = value.apply(this, args);
            const end = performance.now();
            
            if (!ObservableProfiler.updates.has(name)) {
              ObservableProfiler.updates.set(name, []);
            }
            ObservableProfiler.updates.get(name)!.push(end - start);
            
            return result;
          };
        }
        
        return value;
      }
    };
    
    return new Proxy(obs$, handler);
  }
  
  getStats(name: string) {
    const times = this.updates.get(name) || [];
    if (times.length === 0) return null;
    
    const average = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    
    return { count: times.length, average, min, max };
  }
  
  static updates = new Map<string, number[]>();
}

// Usage
const profiler = new ObservableProfiler();
const profiledSession$ = profiler.track('session', observable({ id: '' }));

// Later
console.log(profiler.getStats('session'));
// { count: 150, average: 0.02, min: 0.01, max: 0.05 }
```

### Benchmark Observable vs React State

```typescript
import { observable, observer } from '@legendapp/state/react';
import { useState, useEffect } from 'react';

// Benchmark Legend State
function benchmarkLegendState() {
  const obs$ = observable({ count: 0 });
  const startTime = performance.now();
  
  for (let i = 0; i < 10000; i++) {
    obs$.count.set(i);
  }
  
  const endTime = performance.now();
  return endTime - startTime;
}

// Benchmark React State
function benchmarkReactState() {
  let count = 0;
  const startTime = performance.now();
  
  for (let i = 0; i < 10000; i++) {
    count = i;
  }
  
  const endTime = performance.now();
  return endTime - startTime;
}

// Run benchmarks
console.log('Legend State:', benchmarkLegendState());
console.log('React State:', benchmarkReactState());
```

### Memory Usage Tracking

```typescript
function measureObservableMemory<T>(obs$: Observable<T>): number {
  // Serialize to estimate memory usage
  const serialized = JSON.stringify(obs$.get());
  return new Blob([serialized]).size;
}

// Usage
const largePack$ = observable({
  stickers: Array.from({ length: 1000 }, (_, i) => ({
    id: `sticker-${i}`,
    data: generateLargeStickerData()
  }))
});

const memoryUsage = measureObservableMemory(largePack$);
console.log(`Observable uses approximately ${memoryUsage} bytes`);
```

---

## Summary of Key Optimization Techniques

### 1. Always Use `<For>` for Lists
Prevents full list re-renders on every array change.

### 2. Use `<Memo>` for Frequently Changing Values
Isolates changes to prevent parent component re-renders.

### 3. Use `<Reactive>` for Dynamic Styles
Skips React render cycle for attribute updates.

### 4. Computed Observables for Derived State
Caches expensive calculations and only recomputes when dependencies change.

### 5. Batch Updates Together
Single render for multiple state updates.

### 6. Use `peek()` for Non-Reactive Access
Prevents unnecessary dependency tracking.

### 7. Dispose Unused Observables
Prevents memory leaks in long-running apps.

### 8. Virtualize Large Lists
Only render visible items for better performance.

### 9. Cache Expensive Operations
Memoize computation results to avoid repeated work.

### 10. Profile Before Optimizing
Measure actual performance bottlenecks before applying optimizations.

---

## Performance Checklist

- [ ] Are all arrays using `<For>` instead of `.map()`?
- [ ] Are dynamic styles using `<Reactive>` components?
- [ ] Are computed observables used for derived state?
- [ ] Are batch updates used for multiple state changes?
- [ ] Are unused observables being disposed?
- [ ] Are large lists virtualized?
- [ ] Are expensive operations memoized?
- [ ] Is `peek()` used where reactivity isn't needed?
- [ ] Are performance bottlenecks measured and profiled?
- [ ] Is memory usage optimized for long-running sessions?

---

## Additional Resources

- [Legend State v2 Documentation](https://www.legendapp.com/state/)
- [Legend State GitHub](https://github.com/LegendApp/legend-state)
- [React Performance Best Practices](https://react.dev/learn/render-and-commit)
- [Web Performance Optimization](https://web.dev/performance/)

---

## Common Performance Anti-Patterns

### ❌ Anti-Pattern 1: Computed in Render
```typescript
// BAD - Recreates computed on every render
const MyComponent = observer(() => {
  const filtered$ = computed(() => 
    items$.get().filter(item => item.active)
  );
  
  return <For each={filtered$} />;
});
```

### ✅ Correct Pattern
```typescript
// GOOD - Computed created once
const filtered$ = computed(() => 
  items$.get().filter(item => item.active)
);

const MyComponent = observer(() => {
  return <For each={filtered$} />;
});
```

### ❌ Anti-Pattern 2: Tracking Too Deep
```typescript
// BAD - Tracks every property change
const totalSize$ = computed(() => {
  return packs$.get().reduce((sum, pack) => {
    return sum + pack.stickers.reduce((s, sticker) => 
      s + sticker.sizeBytes, 0
    );
  }, 0);
});
```

### ✅ Correct Pattern
```typescript
// GOOD - Only tracks pack array, not nested properties
const totalSize$ = computed(() => {
  const packs = packs$.peek();
  return packs.reduce((sum, pack) => {
    return sum + pack.stickers.reduce((s, sticker) => 
      s + sticker.sizeBytes, 0
    );
  }, 0);
});
```

### ❌ Anti-Pattern 3: Forgetting Batching
```typescript
// BAD - Multiple renders
function updateMultiple() {
  state$.item1.set('a');
  state$.item2.set('b');
  state$.item3.set('c');
}
```

### ✅ Correct Pattern
```typescript
// GOOD - Single render
function updateMultiple() {
  batch(() => {
    state$.item1.set('a');
    state$.item2.set('b');
    state$.item3.set('c');
  });
}
```

---

This guide provides comprehensive performance optimization techniques for Legend State in the AI Stickies project. Apply these patterns strategically based on your specific use cases and performance requirements.