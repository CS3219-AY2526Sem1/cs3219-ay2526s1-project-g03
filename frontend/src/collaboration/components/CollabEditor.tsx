import useCollabEditor from '../hooks/useCollabEditor';
import CodeMirror from './CodeMirror';

export default function CollabEditor({roomId}: {roomId: string}) {
  const {ytext, awareness, isReady} = useCollabEditor({roomId});
  if (!isReady || !ytext) {
    return <div>Loading...</div>;
  }

  return <CodeMirror ytext={ytext} awareness={awareness} />;
}
