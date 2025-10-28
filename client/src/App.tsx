import { useEffect } from 'react';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import { MenuBar, StatusBar } from '@/components/menu';
import { EditorPanel } from '@/components/editor';
import { AIPanel } from '@/components/ai-panel';
import { PlotsPanel } from '@/components/plots';
import { ConsolePanel } from '@/components/console';
import { socketService } from './services/socket';
import { useStore } from '@/core';

function App(): JSX.Element {
  const setConnected = useStore((state) => state.setConnected);
  const setEditorContent = useStore((state) => state.setEditorContent);

  useEffect(() => {
    socketService.connect();

    // Check connection status
    const checkConnection = setInterval(() => {
      setConnected(socketService.isConnected());
    }, 1000);

    return () => {
      clearInterval(checkConnection);
      socketService.disconnect();
    };
  }, [setConnected]);

  return (
    <div className="app">
      <MenuBar />
      <div className="workspace-shell">
        <Allotment vertical>
          <Allotment.Pane minSize={300} preferredSize="70%">
            <Allotment>
              <Allotment.Pane minSize={400} preferredSize="60%">
                <EditorPanel />
              </Allotment.Pane>
              <Allotment.Pane minSize={300} preferredSize="40%">
                <AIPanel />
              </Allotment.Pane>
            </Allotment>
          </Allotment.Pane>
          <Allotment.Pane minSize={150} preferredSize="30%">
            <Allotment>
              <Allotment.Pane minSize={300} preferredSize="60%">
                <ConsolePanel />
              </Allotment.Pane>
              <Allotment.Pane minSize={300} preferredSize="40%">
                <PlotsPanel />
              </Allotment.Pane>
            </Allotment>
          </Allotment.Pane>
        </Allotment>
      </div>
      <StatusBar />
    </div>
  );
}

export default App;
