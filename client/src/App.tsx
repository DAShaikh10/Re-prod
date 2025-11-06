import { useEffect } from 'react';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import { MenuBar, StatusBar } from '@/components/menu';
import { EditorPanel } from '@/components/editor';
import { AIPanel } from '@/components/ai-panel';
import { ConsolePanel } from '@/components/console';
import { UnifiedRightPane } from '@/components/unified-pane';
import { socketService } from './services/socket';
import { useStore } from '@/core';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

function App(): JSX.Element {
  const setConnected = useStore((state) => state.setConnected);
  const panes = useStore((state) => state.view.panes);

  // Enable global keyboard shortcuts
  useKeyboardShortcuts();

  useEffect(() => {
    socketService.connect();
    if (socketService.isConnected()) {
      setConnected(true);
    }

    const unsubscribe = socketService.onConnectionChange((status) => {
      setConnected(status === 'connected');
    });

    return () => {
      unsubscribe();
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
              {panes.editor && (
                <Allotment.Pane minSize={400} preferredSize="60%">
                  <EditorPanel />
                </Allotment.Pane>
              )}
              <Allotment.Pane minSize={300} preferredSize={panes.editor ? '40%' : '100%'}>
                <AIPanel />
              </Allotment.Pane>
            </Allotment>
          </Allotment.Pane>
          <Allotment.Pane minSize={150} preferredSize="30%">
            <Allotment>
              {panes.console && (
                <Allotment.Pane minSize={250} preferredSize="50%">
                  <ConsolePanel />
                </Allotment.Pane>
              )}
              <Allotment.Pane minSize={250} preferredSize={panes.console ? '50%' : '100%'}>
                <UnifiedRightPane />
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
