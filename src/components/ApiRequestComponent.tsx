// filepath: /C:/TFS/my-react-app/src/components/ApiRequestComponent.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

export interface IFolder {
  id: string;
  title: string;
  album?: string;
  artist?: string;
  duration?: number;
  durationString?: string;
  filesize?: number;
  filesizeString?: string;
  disc?: number;
  track?: number;
  genre?: string;
}

const ApiRequestComponent: React.FC = () => {
    const [folders, setFolders] = useState<IFolder[]>([]);
    const [sid, setSid] = useState<string>('');
    

    useEffect(() => { 
        const fetchData = async () => {
          try {
            const response = await axios.get('http://localhost:3131/syno/auth');
            setSid(response.data.data.sid);
          } catch (error) {
            setSid(JSON.stringify(error))
          }
        };

        fetchData();
    }, []);
    
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:3131/syno/album?artist=Andrew%20Hill');
        setFolders(response.data as IFolder[]);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [sid]);

  return (
      <div>
      <label htmlFor='sid'>sid:</label>
      <input type='text' id='sid' name='sid' value={sid} />
      
      <h1>Folders</h1>
      <DataTable value={folders}>
        <Column field='id' header='ID' />
        <Column field='title' header='Title' />
        <Column field='album' header='Album' />
        <Column field='artist' header='Artist' />
      </DataTable>
    </div>
  );
};

export default ApiRequestComponent;