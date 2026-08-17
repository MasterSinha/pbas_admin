// Admin shell layout — sidebar + main content area.
// Replace this with your teammate's design.
// The <Outlet /> is where nested page components render.

import { Outlet } from 'react-router-dom'

export default function AdminLayout() {
  return (
    <div>
      {/* Sidebar goes here */}
      <main>
        <Outlet />
      </main>
    </div>
  )
}
