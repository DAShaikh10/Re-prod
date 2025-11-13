import { useEffect, useState } from 'react';
import type { Cell } from '@/core/execution/cellParser';
import { parseCells } from '@/core';

export function useEditorCells(content: string, filepath?: string): Cell[] {
  const [cells, setCells] = useState<Cell[]>([]);

  useEffect(() => {
    const filename = filepath || 'Untitled.R';
    setCells(parseCells(content, filename));
  }, [content, filepath]);

  return cells;
}
