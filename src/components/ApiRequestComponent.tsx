import axios from 'axios';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import React, { useEffect, useState } from 'react';
import config from '../config.json';
import { IFolder } from '../model/folder';
import { InputText } from 'primereact/inputtext';
import './ApiRequestComponent.scss';

const ApiRequestComponent: React.FC = () => {
  const yearAlbumRegex = /^(?:\[([^\[]*)\]\s*)?(.+)$/;
  const [folders, setFolders] = useState<IFolder[]>([]);
  const [sid, setSid] = useState<string>('');
  const [dirIds, setDirIds] = useState<string[]>([]);
  const [artist, setArtist] = useState<string>('');
  const tableRef = React.createRef<DataTable<IFolder[]>>();

  const titleHeaderTemplate = () => {
    const title = dirIds.length === 0
      ? 'Artist'
      : (dirIds.length === 1
        ? ''
        : 'Track');
    return <span>{ title}</span>;
  };

  const titleBodyTemplate = (rowData: IFolder) => {
    const onTitleClick = (): void => {
      setFolders([]);
      setDirIds((prevDirIds) => [...prevDirIds, rowData.id]);
      setArtist(() => dirIds.length === 0 ? rowData.title : '');
      if (dirIds.length === 0)
        tableRef.current?.saveState();
    }

    return rowData.track
      ? <span>{rowData.title}</span>
      : <a id="tableLink" onClick={() => onTitleClick()}>{rowData.title}</a>;
  };

  const yearBodyTemplate = (rowData: IFolder) => {
    const year = dirIds.length === 1
      ? parseAlbum(rowData.title).year
      : rowData.year;
    return <span>{year}</span>;
  };

  const albumBodyTemplate = (rowData: IFolder) => {
    const album = dirIds.length === 1
      ? parseAlbum(rowData.title).album
      : rowData.album;
    return <span>{album}</span>;
  };

  const artistBodyTemplate = (rowData: IFolder) => {
    return <span>{artist || rowData.artist}</span>;
  };

  const parseAlbum = (album: string | undefined): { album: string, year: string; } => {
    const match = yearAlbumRegex.exec(album || '');
    return {
      album: match ? match[2] : '',
      year: match ? match[1] : ''
    }; 
  }

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
        let _folders = response.data as IFolder[];
        if (_folders.length > 0 && _folders[0].track) 
          _folders =_folders.sort((a, b) => (a.album || '').localeCompare(b.album || '') || (a.disc || 0) - (b.disc || 0) || (a.track || 0) - (b.track || 0));
        setFolders(_folders);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [sid, dirIds]);

  const onBackClick = (): void => {
    setFolders([]);
    setDirIds((prevDirIds) => prevDirIds.slice(0, prevDirIds.length - 1));
    setArtist(() => dirIds.length === 2 && folders.length > 0 ? folders[0].artist || '' : '');
    if (dirIds.length === 1)
      tableRef.current?.restoreState();
  };

  return (
    <div>
      <div id="sidDiv">
        <label htmlFor="sid">sid</label>
        <InputText type="text" className="p-inputtext" id="sid" name="sid" value={sid} disabled />
      </div>

      <h3>{dirIds.length > 0 && (<a id="back" onClick={() => onBackClick()}><i className="pi pi-arrow-left" /></a>)}</h3>
      <DataTable value={folders} stripedRows scrollable scrollHeight="75vh" paginator rows={25} rowsPerPageOptions={[10, 25, 50, 100]} tableStyle={{ minWidth: '50rem' }} ref={tableRef}>
        <Column field="id" header="ID" style={{width: '5%'}}/>
        <Column header={titleHeaderTemplate} body={titleBodyTemplate} />
        <Column header="Year" body={yearBodyTemplate} style={{ width: '10%' }} />
        <Column header="Album" body={albumBodyTemplate} />
        <Column header="Artist" body={artistBodyTemplate} />
        <Column field="durationString" header="Duration" />
        <Column field="filesizeString" header="File size" />
        <Column field="disc" header="Disc" />
        <Column field="track" header="Track" />
      </DataTable>
    </div>
  );
};

export default ApiRequestComponent;
