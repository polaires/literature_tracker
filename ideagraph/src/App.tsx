import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { ThesisViewNew } from './pages/ThesisViewNew';
import { Reader } from './pages/Reader';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/thesis/:thesisId" element={<ThesisViewNew />} />
          <Route path="/reader" element={<Reader />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
