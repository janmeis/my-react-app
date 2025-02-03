import { createContext } from 'react';

export interface IAppProps {
  firstRow: number;
  currentPage: number;
  rowsPerPage: number;
}

export const AppContext = createContext<IAppProps | null>(null);
