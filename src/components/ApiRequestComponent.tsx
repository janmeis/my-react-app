import axios from 'axios';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import React, { useEffect, useState } from 'react';
import config from '../config.json';
import { IFolder } from '../model/folder';
import { InputText } from 'primereact/inputtext';

const ApiRequestComponent: React.FC = () => {
  const [folders, setFolders] = useState<IFolder[]>([]);
  const [sid, setSid] = useState<string>('');
  const [dirIds, setDirIds] = useState<string[]>([]);

  const titleHeaderTemplate = () => {
    return <span>Title</span>;
  };

  const titleTemplate = (rowData: IFolder) => {
    return rowData.track
      ? <span>{rowData.title}</span>
      : <a style={{ cursor: 'pointer', color: 'light-blue', textDecoration: 'underline' }} onClick={() => setDirIds((prevDirIds) => [...prevDirIds, rowData.id])}>{rowData.title}</a>;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${config.baseUrl}/auth`);
        setSid(response.data.data.sid);
      } catch (error) {
        setSid(JSON.stringify(error));
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let url = `${config.baseUrl}/folder`;
        if (dirIds.length > 0) {
          const dirId = dirIds[dirIds.length - 1];
          url += `?dirId=${dirId}`;
        }
        const response = await axios.get(url);
        setFolders(response.data as IFolder[]);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [sid, dirIds]);

  return (
    <div>
      <h1>API Request</h1>
      <label htmlFor="sid" style={{paddingRight: '10px', fontWeight: 'bold'}}>sid</label>
      <InputText type="text" className="p-inputtext-lg" id="sid" name="sid" value={sid} style={{width: '50%'}} />

      <h1>Folders</h1>
      <h3>{dirIds.length > 0 && (<a style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => { setFolders([]); setDirIds((prevDirIds) => [...prevDirIds.slice(0, -1)])}}>back</a>)}</h3>
      <DataTable value={folders} stripedRows paginator rows={10} rowsPerPageOptions={[10, 25, 50, 100]} tableStyle={{ minWidth: '50rem' }}>
        <Column field="id" header="ID" style={{width: '5%'}}/>
        <Column field="title" header={titleHeaderTemplate} body={titleTemplate} />
        <Column field="year" header="Year" style={{ width: '10%' }} />
        <Column field="album" header="Album" />
        <Column field="artist" header="Artist" />
        <Column field="durationString" header="Duration" />
        <Column field="filesizeString" header="File size" />
        <Column field="track" header="Track" />
      </DataTable>
    </div>
  );
};

export default ApiRequestComponent;
