import React from 'react';
import {createRoot} from 'react-dom/client';
import NotebookApp from './app/notebook-app';
import './app/notebook.css';
createRoot(document.getElementById('root')!).render(<NotebookApp/>);
