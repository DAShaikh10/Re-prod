import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const
};

export function IconPlay(props: IconProps): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <polygon points="6 4 19 12 6 20 6 4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconPlayCircle(props: IconProps): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <circle cx="12" cy="12" r="10" />
      <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconRobot(props: IconProps): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <rect x="4" y="7" width="16" height="12" rx="3" ry="3" />
      <circle cx="9" cy="13" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="15" cy="13" r="1.6" fill="currentColor" stroke="none" />
      <path d="M12 3v4" />
    </svg>
  );
}

export function IconSend(props: IconProps): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <polyline points="4 4 20 12 4 20 7 12 4 4" />
    </svg>
  );
}

export function IconSquare(props: IconProps): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

export function IconClipboard(props: IconProps): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <rect x="6" y="5" width="12" height="16" rx="2" />
      <path d="M9 5V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1" />
      <rect x="9" y="9" width="6" height="2" rx="0.5" fill="currentColor" stroke="none" />
      <rect x="9" y="13" width="6" height="2" rx="0.5" fill="currentColor" stroke="none" opacity="0.6" />
    </svg>
  );
}

export function IconCheck(props: IconProps): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <polyline points="5 12.5 10 17 19 7" />
    </svg>
  );
}

export function IconTrash(props: IconProps): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M3 7h18" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M9 11v6" />
      <path d="M12 11v6" />
      <path d="M15 11v6" />
      <rect x="5" y="7" width="14" height="13" rx="2" ry="2" />
    </svg>
  );
}

export function IconBarChart(props: IconProps): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M4 20h16" />
      <rect x="6" y="10" width="3" height="7" rx="1" />
      <rect x="11" y="6" width="3" height="11" rx="1" />
      <rect x="16" y="8" width="3" height="9" rx="1" />
    </svg>
  );
}

export function IconCheckCircle(props: IconProps): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="8 12 11 15 16 9" />
    </svg>
  );
}

export function IconXCircle(props: IconProps): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="9" y1="9" x2="15" y2="15" />
      <line x1="15" y1="9" x2="9" y2="15" />
    </svg>
  );
}

export function IconChevronLeft(props: IconProps): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

export function IconChevronRight(props: IconProps): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export function IconLightbulb(props: IconProps): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a7 7 0 0 0-7 7c0 2.6 1.4 4.4 3 6a5 5 0 0 1 1.4 3.1V19h5.2v-0.9c0-1.2.5-2.3 1.4-3.1 1.6-1.6 3-3.4 3-6a7 7 0 0 0-7-7z" />
    </svg>
  );
}
