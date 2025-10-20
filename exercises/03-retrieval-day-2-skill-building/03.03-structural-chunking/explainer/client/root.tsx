import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ChunkCard,
  Pagination,
  SearchInput,
  StatsBar,
  Wrapper,
} from './components.tsx';
import './tailwind.css';

type ChunksResponse = {
  chunks: Array<{ index: number; content: string }>;
  stats: {
    total: number;
    avgChars: number;
    pageCount: number;
    currentPage: number;
  };
};

const ChunkViewer = () => {
  const [inputValue, setInputValue] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['chunks', search, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        search,
        page: page.toString(),
      });
      const res = await fetch(`/api/chunks?${params}`);
      return (await res.json()) as ChunksResponse;
    },
    refetchInterval: 5000,
  });

  const handleSearchSubmit = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <Wrapper
      header={
        <>
          <SearchInput
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSearchSubmit}
          />
          {isLoading ? (
            <div className="flex-shrink-0 border-b border-border bg-background/80 backdrop-blur-sm">
              <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-center">
                <span className="text-xs text-muted-foreground">
                  Loading...
                </span>
              </div>
            </div>
          ) : data ? (
            <StatsBar
              total={data.stats.total}
              avgChars={data.stats.avgChars}
              currentPage={data.stats.currentPage}
              pageCount={data.stats.pageCount}
            />
          ) : null}
        </>
      }
      footer={
        isLoading || !data ? null : (
          <Pagination
            currentPage={page}
            pageCount={data.stats.pageCount}
            onPageChange={setPage}
          />
        )
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          Loading chunks...
        </div>
      ) : data ? (
        data.chunks.map((chunk) => (
          <ChunkCard
            key={chunk.index}
            index={chunk.index}
            content={chunk.content}
          />
        ))
      ) : null}
    </Wrapper>
  );
};

const App = () => {
  return <ChunkViewer />;
};

const root = createRoot(document.getElementById('root')!);
root.render(
  <QueryClientProvider client={new QueryClient()}>
    <App />
  </QueryClientProvider>,
);
