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
  const {
    setConnected,
    addExecutionResult,
    addAIMessage,
    setAILoading,
    setEditorContent
  } = useStore();

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

    socket.on('execution-result', (result) => {
      addExecutionResult(result);
    });

    socket.on('execution-error', (error) => {
      addExecutionResult({
        stdout: '',
        stderr: error.message,
        plots: [],
        timestamp: error.timestamp,
        duration: 0,
        success: false
      });
    });

    socket.on('ai-response', (response) => {
      addAIMessage({
        id: Date.now().toString(),
        role: 'assistant',
        content: response.message,
        code: response.suggestedCode,
        timestamp: response.timestamp
      });
      setAILoading(false);
    });

    socket.on('file-changed', (data) => {
      setEditorContent(data.content);
    });

    return () => {
      socketService.disconnect();
    };
  }, [setConnected, addExecutionResult, addAIMessage, setAILoading, setEditorContent]);

  return (
    <div className="app">
      <MenuBar />
      <div className="main-workspace">
        <Allotment>
          <Allotment.Pane minSize={400} preferredSize="60%">
            <EditorPanel />
          </Allotment.Pane>
          <Allotment.Pane minSize={300} preferredSize="40%">
            <Allotment vertical>
              <Allotment.Pane minSize={200} preferredSize="50%">
                <AIPanel />
              </Allotment.Pane>
              <Allotment.Pane minSize={200} preferredSize="50%">
                <PlotsPanel />
              </Allotment.Pane>
            </Allotment>
          </Allotment.Pane>
        </Allotment>
      </div>
      <div className="bottom-workspace">
        <ConsolePanel />
      </div>
      <StatusBar />
    </div>
  );
}

export default App;
