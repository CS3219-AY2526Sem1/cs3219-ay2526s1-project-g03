import {Route, Routes} from 'react-router-dom';
import Register from './pages/register';
import Input from './collaboration/pages/Input';
import {CollabPage} from './collaboration/pages/CollabPage';

export function Home() {
  return <div>Home</div>;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Register />} />
      <Route path="room" element={<Input />} />
      <Route path="room/:roomId" element={<CollabPage />} />
    </Routes>
  );
}

export default App;
