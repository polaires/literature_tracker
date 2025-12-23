import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { ThesisViewNew } from './pages/ThesisViewNew';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/thesis/:thesisId" element={<ThesisViewNew />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
