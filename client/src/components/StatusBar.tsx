import { useStore } from '../store/useStore';

export function StatusBar(): JSX.Element {
  const { editor, settings, execution } = useStore();

  return (
    <div className="statusbar">
      <div className="statusbar-left">
        <span className="statusbar-item">
          {editor.filepath || 'Untitled'}
        </span>
        {editor.isDirty && (
          <span className="statusbar-item statusbar-modified">Modified</span>
        )}
        <span className="statusbar-item">
          Ln {editor.cursorPosition.line}, Col {editor.cursorPosition.column}
        </span>
      </div>
      <div className="statusbar-right">
        {execution.isRunning && (
          <span className="statusbar-item statusbar-running">
            <div className="spinner"></div>
            Running R...
          </span>
        )}
        <span className="statusbar-item">
          R: {settings.rPath}
        </span>
      </div>
    </div>
  );
}
