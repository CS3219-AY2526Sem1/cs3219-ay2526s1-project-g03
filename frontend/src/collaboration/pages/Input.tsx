import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import PeerPrepIcon from '../../assets/peerprep-icon.svg';

export default function Input() {
  const [roomId, setRoomId] = useState<string>('');
  const navigate = useNavigate();

  function handleOnClick() {
    if (roomId.trim()) {
      navigate(`/room/${roomId.trim()}`);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setRoomId(e.target.value);
  }
  return (
    // <div>
    //   <h1>Room Id</h1>
    //   <input type="text" id="roomId" onChange={handleChange}></input>
    //   <button onClick={() => handleOnClick()}>Enter room</button>
    // </div>
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      {/* Development Disclaimer */}
      <div className="fixed top-0 left-0 right-0 bg-yellow-400 text-yellow-900 py-2 px-4 text-center text-sm font-medium shadow-md">
        ⚠️ Development Only: This page will not exist in the final product
      </div>
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-block">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              <img src={PeerPrepIcon} alt="PeerPrep" className="header-logo" />
            </h1>
            <p className="text-gray-600 text-sm">Collaborative Coding Platform</p>
          </div>
        </div>

        {/* Input Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Join a Room</h2>
          <p className="text-gray-600 text-sm mb-6">
            Enter a room ID to start collaborating with your peers
          </p>

          {/* Input Field */}
          <div className="mb-6">
            <label htmlFor="roomId" className="block text-sm font-medium text-gray-700 mb-2">
              Room ID
            </label>
            <input
              type="text"
              id="roomId"
              value={roomId}
              onChange={handleChange}
              placeholder="Enter room ID..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Button */}
          <button
            onClick={handleOnClick}
            disabled={!roomId.trim()}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-300 shadow-md hover:shadow-lg"
          >
            Enter Room
          </button>

          {/* Optional: Quick Actions */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center mb-3">Don't have a room ID?</p>
            <button
              onClick={() => {
                const randomId = Math.random().toString(36).substring(2, 10);
                setRoomId(randomId);
              }}
              className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors text-sm"
            >
              Generate Random Room ID
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
