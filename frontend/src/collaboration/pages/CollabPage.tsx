import {useParams, useNavigate} from 'react-router-dom';
import CollabEditor from '../components/CollabEditor';

export function CollabPage() {
  const {roomId} = useParams<{roomId: string}>();
  const navigate = useNavigate();

  if (!roomId) {
    navigate('/room');
    return null;
  }

  //TODO: handle leave room/exit - remove cursor and user from partykit room
  function handleLeaveRoom() {
    navigate('/room');
  }

  return (
    <div style={{width: '75em', height: '100vh', display: 'flex', flexDirection: 'column'}}>
      <div
        style={{
          padding: '10px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <h2>Room: {roomId}</h2>
        <button
          onClick={handleLeaveRoom}
          style={{
            padding: '8px 16px',
            backgroundColor: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Leave Room
        </button>
      </div>
      <div style={{flex: 1, width: '100%'}}>
        <CollabEditor roomId={roomId} />
      </div>
    </div>
  );
}
