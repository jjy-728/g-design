import React, { createContext, useContext, useState, useCallback } from 'react'

const AppContext = createContext(null)

export const AppProvider = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false)
  const [breadcrumb, setBreadcrumb] = useState([])

  const toggleSidebar = useCallback(() => {
    setCollapsed((prev) => !prev)
  }, [])

  const updateBreadcrumb = useCallback((items) => {
    setBreadcrumb(items)
  }, [])

  const value = {
    collapsed,
    toggleSidebar,
    breadcrumb,
    updateBreadcrumb
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
