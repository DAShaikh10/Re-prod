import { useStore } from '../store/useStore';

export function MenuBar(): JSX.Element {
  const { isConnected } = useStore();

  return (
    <div className="menubar">
      <div className="menubar-left">
        <span className="menubar-brand">Re-prod</span>
        <div className="menubar-menu">
          <div className="menu-item">File</div>
          <div className="menu-item">Edit</div>
          <div className="menu-item">Code</div>
          <div className="menu-item">View</div>
          <div className="menu-item">Plots</div>
          <div className="menu-item">Session</div>
          <div className="menu-item">Tools</div>
          <div className="menu-item">Help</div>
        </div>
      </div>
      <div className="menubar-right">
        <div className={`connection-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
          <span className="connection-dot"></span>
          <span className="connection-text">{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>
    </div>
  );
}
