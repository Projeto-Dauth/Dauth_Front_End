export default function AppLayout({ sidebar, children, sidebarWidth = '240px' }) {
  return (
    <div
      className="flex h-screen overflow-hidden"
    >
      {sidebar}
      <main className="flex-1 overflow-auto bg-bg px-8 py-7">
        {children}
      </main>
    </div>
  )
}
