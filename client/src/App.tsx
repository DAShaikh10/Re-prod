import { useEffect } from 'react';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import { MenuBar } from './components/MenuBar';
import { EditorPanel } from './components/EditorPanel';
import { AIPanel } from './components/AIPanel';
import { PlotsPanel } from './components/PlotsPanel';
import { ConsolePanel } from './components/ConsolePanel';
import { StatusBar } from './components/StatusBar';
import { socketService } from './services/socket';
import { useStore } from './store/useStore';
import './App.css';

function App(): JSX.Element {
  const { setConnected, setEditorContent } = useStore();

  useEffect(() => {
    const socket = socketService.connect();

    socket.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    socket.on('file-changed', (data) => {
      setEditorContent(data.content);
    });

    return () => {
      socketService.disconnect();
    };
  }, [setConnected, setEditorContent]);

  return (
    <div className="app">
      <MenuBar />
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
      <StatusBar />
    </div>
  );
}

export default App;
