/**
 * Hook to access Monaco Editor instance
 *
 * This hook provides access to the Monaco editor instance
 * for menu actions that need to interact with the editor.
 *
 * NOTE: This is a workaround. A better approach would be to:
 * 1. Store editor instance in Zustand store (EditorPanel already has editorRef)
 * 2. Access it from menuActions via useStore
 * 3. Avoid DOM manipulation and non-public API (_monacoEditor)
 *
 * Current implementation is fragile but functional.
 */

import { useRef, useEffect } from 'react';

/**
 * Get Monaco editor instance
 *
 * Strategy: Look for monaco-editor DOM element and retrieve
 * the editor instance stored on it by @monaco-editor/react
 *
 * WARNING: Uses non-public API (_monacoEditor property)
 */
export function useMonacoEditor() {
  const editorRef = useRef<any>(null);

  useEffect(() => {
    // Try to find Monaco editor instance
    const findEditor = () => {
      const editorElement = document.querySelector('.monaco-editor');
      if (editorElement) {
        // Monaco editor stores instance on DOM element
        editorRef.current = (editorElement as any)._monacoEditor;
      }
    };

    // Try immediately
    findEditor();

    // Also try after a short delay (in case editor hasn't mounted yet)
    const timer = setTimeout(findEditor, 500);

    return () => clearTimeout(timer);
  }, []);

  return editorRef.current;
}
