import {useState} from 'react';
import {Route, Routes} from 'react-router-dom';
import Register from './pages/register';

export function Home() {
  return <div>Home</div>;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  );
}

export default App;
