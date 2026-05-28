import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import ChatbotBubble from '../ChatbotBubble'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--app-bg)] transition-colors duration-300">
      {/* Accessibility: skip to main content */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header onMenuToggle={() => setSidebarOpen(true)} />
        <main
          id="main-content"
          className="flex-1 overflow-y-auto px-4 lg:px-8 py-6"
          tabIndex={-1}
        >
          <Outlet />
        </main>
      </div>

      {/* Chatbot floating bubble */}
      <ChatbotBubble />
    </div>
  )
}
