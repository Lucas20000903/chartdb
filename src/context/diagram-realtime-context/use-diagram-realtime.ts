import { useContext } from 'react';

import { diagramRealtimeContext } from './diagram-realtime-context';

export const useDiagramRealtime = () => useContext(diagramRealtimeContext);
