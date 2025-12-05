import React from 'react'
import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import AuthHandoverPage from './pages/AuthHandoverPage.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/auth/handover" element={<AuthHandoverPage />} />
    </Routes>
  )
}

export default App
