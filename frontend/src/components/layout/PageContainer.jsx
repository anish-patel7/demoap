import TopHeader from './TopHeader';

export default function PageContainer({ children, onMenuClick }) {
  return (
    <main className="flex-1 flex flex-col h-full overflow-hidden bg-background min-w-0">
      <TopHeader onMenuClick={onMenuClick} />
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {children}
      </div>
    </main>
  );
}
