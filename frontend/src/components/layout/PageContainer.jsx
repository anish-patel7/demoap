import TopHeader from './TopHeader';

export default function PageContainer({ children }) {
  return (
    <main className="flex-1 flex flex-col h-screen overflow-hidden bg-background min-w-0">
      <TopHeader />
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {children}
      </div>
    </main>
  );
}
