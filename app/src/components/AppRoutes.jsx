import React from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router';

export default function AppRoutes({ pages }) {
  const { search } = useLocation();
  return (
    <Routes>
      <Route path="/" element={<Navigate to={`/hoje${search}`} replace />} />
      {Object.entries(pages).map(([id, element]) => (
        <Route key={id} path={`/${id}`} element={element} />
      ))}
      <Route path="*" element={<Navigate to={`/hoje${search}`} replace />} />
    </Routes>
  );
}
