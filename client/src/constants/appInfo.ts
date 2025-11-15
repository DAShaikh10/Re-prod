/**
 * Application information constants
 * Centralized definitions for app metadata, links, and tech stack
 */

export interface AppLink {
  label: string;
  href: string;
}

export interface TechStackItem {
  title: string;
  description: string;
}

export const LINKS: AppLink[] = [
  { label: 'Documentation', href: 'https://reprod.dev/docs' },
  { label: 'GitHub', href: 'https://github.com/reprod' },
  { label: 'Report Issue', href: 'https://github.com/reprod/issues/new' },
];

export const TECH_STACK: TechStackItem[] = [
  {
    title: 'Rust Core',
    description: 'Tokio + Axum orchestrate the execution engine and WebSocket shell.',
  },
  {
    title: 'Tauri Desktop',
    description: 'Native desktop wrapper with secure command bridge.',
  },
  {
    title: 'React + Monaco',
    description: 'TypeScript UI with Monaco editor, Zustand state, and AI tooling.',
  },
];
