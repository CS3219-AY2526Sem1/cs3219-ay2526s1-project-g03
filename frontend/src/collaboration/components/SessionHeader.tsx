import PeerPrepIcon from '../../assets/peerprep-icon.svg';
export default function SessionHeader() {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <div className="text-blue-500 font-bold text-xl">
          <img src={PeerPrepIcon} alt="PeerPrep" className="header-logo" />
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-semibold text-gray-700">Session 15:42</div>
        <div className="text-sm text-red-400">Penalty timer 09:01</div>
      </div>
    </header>
  );
}
