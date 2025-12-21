import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { ThesisView } from './pages/ThesisView';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container min-h-screen bg-gray-50 dark:bg-gray-900">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/thesis/:thesisId" element={<ThesisView />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
