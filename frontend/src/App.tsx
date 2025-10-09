import './App.css';
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import Input from './collaboration/pages/Input';
import {CollabPage} from './collaboration/pages/CollabPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<h1>Home page :D</h1>} />
        <Route path="room" element={<Input />} />
        <Route path="room/:roomId" element={<CollabPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
