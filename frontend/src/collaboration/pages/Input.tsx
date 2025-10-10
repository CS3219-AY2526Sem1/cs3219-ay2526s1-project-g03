import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import CollabEditor from '../components/CollabEditor';

export default function Input() {
  const [roomId, setRoomId] = useState<string>('');
  const navigate = useNavigate();

  function handleOnClick() {
    if (roomId.trim()) {
      navigate(`/room/${roomId.trim()}`);
    }
    return <CollabEditor roomId={roomId} />;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setRoomId(e.target.value);
  }
  return (
    <div>
      <h1>Room Id</h1>
      <input type="text" id="roomId" onChange={handleChange}></input>
      <button onClick={() => handleOnClick()}>Enter room</button>
    </div>
  );
}
