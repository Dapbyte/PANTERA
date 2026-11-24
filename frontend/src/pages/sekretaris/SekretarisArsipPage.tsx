import React from 'react';
import { ArchiveWorkspace } from '../../components/common/ArchiveWorkspace';

export const SekretarisArsipPage: React.FC = () => {
  return <ArchiveWorkspace allowCreate allowDelete={false} allowEditLocation />;
};
