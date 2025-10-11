import useCollabEditor from '../hooks/useCollabEditor';
import CodeMirror from './CodeMirror';

export default function CollabEditor({roomId}: {roomId: string}) {
  const {ytext, awareness, isReady} = useCollabEditor({roomId});
  if (!isReady || !ytext) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{padding: '20px'}}>
      <h2>Happy Coding :D</h2>
      <CodeMirror ytext={ytext} awareness={awareness} />
    </div>
  );
}
