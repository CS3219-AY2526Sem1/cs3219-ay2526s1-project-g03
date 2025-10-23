import {Route, Routes} from 'react-router-dom';
import Home from './pages/home';
import Register from './pages/register';
import Input from './collaboration/pages/Input';
import {CollabPage} from './collaboration/pages/CollabPage';
import Dashboard from './pages/dashboard/dashboard'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Register />} />
      <Route path="room" element={<Input />} />
      <Route path="room/:roomId" element={<CollabPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}

export default App;
