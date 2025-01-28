import axios from 'axios';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import React, { useEffect, useState } from 'react';
import config from '../config.json';
import { IFolder } from '../model/folder';
import { InputText } from 'primereact/inputtext';
import './ApiRequestComponent.scss';
import { ToggleButton } from 'primereact/togglebutton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMusic, faFolder, faFolderOpen } from '@fortawesome/free-solid-svg-icons';
import { Image } from 'primereact/image';
import Breadcrumb from './Breadcrumb';
import ArtistLetters from './artistLetters';

export interface IAudioSource {
  artist: IFolder;
  album: IFolder;
  source: 'artist' | 'album' | 'track';
}

const ApiRequestComponent: React.FC = () => {
  const [isSidDisplayed, setIsSidDisplayed] = useState<boolean>(true);
  const [folders, setFolders] = useState<IFolder[]>([]);
  const [sid, setSid] = useState<string>('');
  const [audioSource, setAudioSource] = useState<IAudioSource>({
    artist: {} as IFolder,
    album: {} as IFolder,
    source: 'artist',
  } as IAudioSource);
  const [checked, setChecked] = useState<boolean>(false);
  const [selectedLetter, setSelectedLetter] = useState<string>('1');
  const [cover, setCover] = useState<string>('');

  const tableRef = React.createRef<DataTable<IFolder[]>>();

  setTimeout(() => setIsSidDisplayed(false), 5000);

  const parseUrl = (baseUrl: string): { protocol: string; hostname: string; port: string } => {
    const urlRegex = /^(https?:\/\/)?([^:\/\s]+)(?:(:\d+))?/;
    const parsed = urlRegex.exec(baseUrl);
    return parsed
      ? { protocol: parsed[1], hostname: parsed[2], port: parsed[3] }
      : { protocol: 'http://', hostname: 'localhost', port: '' };
  };

  const baseUrl = `${location.protocol}//${location.hostname}${parseUrl(config.baseUrl).port}`;

  const onArtistClick = (rowData: IFolder): void => {
    setFolders([]);
    setAudioSource(_ => ({ artist: rowData, album: {} as IFolder, source: 'album' }) as IAudioSource);
    tableRef.current?.saveState();
  };

  const iconBodyTemplate = (rowData: IFolder, onClick: (rowData: IFolder) => void): JSX.Element => (
    <a className='artist-icon' onClick={_ => onClick(rowData)}>
      <FontAwesomeIcon id='fa-folder' icon={faFolder} size='xl' />
      <FontAwesomeIcon id='fa-folder-open' icon={faFolderOpen} size='xl' />
    </a>
  );

  const artistBodyTemplate = (rowData: IFolder): JSX.Element => (
    <a id='tableLink' onClick={_ => onArtistClick(rowData)}>
      {rowData.title}
    </a>
  );

  const albumArtistBodyTemplate = (): JSX.Element => <span>{audioSource.artist.title}</span>;

  const parseAlbum = (album: string | undefined): { album: string; year: string } => {
    const yearAlbumRegex = /^(?:\[([^\[]*)\]\s*)?(.+)$/;
    const match = yearAlbumRegex.exec(album || '');
    return {
      album: match ? match[2] : '',
      year: match ? match[1] : '',
    };
  };

  const onAlbumClick = (rowData: IFolder): void => {
    setFolders;
    setAudioSource(prevState => ({ ...prevState, album: rowData, source: 'track' }));
  };

  const albumBodyTemplate = (rowData: IFolder): JSX.Element => {
    const album = parseAlbum(rowData.title).album;
    return (
      <a id='tableLink' onClick={_ => onAlbumClick(rowData)}>
        {album}
      </a>
    );
  };

  const yearBodyTemplate = (rowData: IFolder): JSX.Element => {
    const year = parseAlbum(rowData.title).year;
    return <span>{year}</span>;
  };

  const getFolders = async (dirId?: string): Promise<{ total: number; cover: string; folders: IFolder[] }> => {
    let url = `${baseUrl}/folder`;
    if (dirId) url += `?dirId=${dirId}`;
    const response = await axios.get(url);
    let _folders = response.data.folders as IFolder[];
    return { total: response.data.total, cover: response.data.cover, folders: _folders };
  };

  const parseCover = (coverUrl: string): string => {
    if (location.hostname === 'localhost') return coverUrl;

    const { hostname } = parseUrl(coverUrl);
    const _result = coverUrl.replace(hostname, location.hostname);
    console.log(_result);
    return _result;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${baseUrl}/auth`);
        setSid(response.data.data.sid);
      } catch (error) {
        setSid(JSON.stringify(error));
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (audioSource.source !== 'artist') return;

    const fetchData = async () => {
      try {
        const response = await getFolders();
        setFolders(response.folders);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [audioSource]);

  useEffect(() => {
    if (audioSource.source !== 'artist') return;
    tableRef.current?.restoreState();
  }, [audioSource]);

  useEffect(() => {
    if (audioSource.source !== 'album') return;

    const fetchData = async () => {
      try {
        const response = await getFolders(audioSource.artist.id);
        setFolders(response.folders);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [audioSource]);

  useEffect(() => {
    if (audioSource.source !== 'track') return;

    const fetchData = async () => {
      try {
        const response = await getFolders(audioSource.album.id);
        const folders = response.folders.sort(
          (a, b) =>
            (a.album || '').localeCompare(b.album || '') ||
            (a.disc || 0) - (b.disc || 0) ||
            (a.track || 0) - (b.track || 0)
        );
        setCover(parseCover(response.cover));
        setFolders(folders);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [audioSource]);

  const onBackClick = (): void => {
    setFolders([]);
    if (audioSource.source === 'track') {
      setCover('');
      setAudioSource(prevState => ({ ...prevState, album: {} as IFolder, source: 'album' }));
    } else if (audioSource.source === 'album') {
      setAudioSource(_ => ({ artist: {} as IFolder, album: {} as IFolder, source: 'artist' }));
    }
  };

  return (
    <div>
      <div id='sidDiv' style={{ display: isSidDisplayed ? 'block' : 'none' }}>
        <label htmlFor='sid'>sid</label>
        <InputText type='text' className='p-inputtext' id='sid' name='sid' value={sid} disabled />
      </div>

      <Breadcrumb audioSource={audioSource} parseAlbum={parseAlbum} linkClick={onBackClick} />

      {audioSource.source === 'artist' && (
        <>
          <div className='flex justify-content-left mb-3'>
            <ToggleButton
              onLabel=''
              offLabel=''
              onIcon='pi pi-table'
              offIcon='pi pi-bars'
              checked={checked}
              onChange={e => setChecked(e.value)}
              className='w-5rem text-3xl'
            />
          </div>
          {checked && (
            <ArtistLetters
              folders={folders}
              artistBodyTemplate={artistBodyTemplate}
              selectedLetter={selectedLetter}
              selectedLetterClick={setSelectedLetter}
            />
          )}
          {!checked && (
            <div className='min-w-full'>
              <DataTable
                value={folders}
                stripedRows
                scrollable
                scrollHeight='75vh'
                paginator
                rows={25}
                rowsPerPageOptions={[10, 25, 50, 100]}
                ref={tableRef}
              >
                <Column body={rowData => iconBodyTemplate(rowData, onArtistClick)} style={{ width: '0.35rem' }} />
                <Column field='id' header='ID' style={{ width: '5%' }} />
                <Column header='Artist' body={rowData => artistBodyTemplate(rowData)} />
              </DataTable>
            </div>
          )}
        </>
      )}
      {audioSource.source === 'album' && (
        <div className='min-w-full'>
          <DataTable
            value={folders}
            stripedRows
            scrollable
            scrollHeight='75vh'
            paginator
            rows={25}
            rowsPerPageOptions={[10, 25, 50, 100]}
            tableStyle={{ maxWidth: '65vw' }}
          >
            <Column body={rowData => iconBodyTemplate(rowData, onAlbumClick)} style={{ width: '0.35rem' }} />
            <Column field='id' header='ID' style={{ width: '5%' }} />
            <Column header='Artist' body={albumArtistBodyTemplate} />
            <Column header='Album' body={albumBodyTemplate} />
            <Column header='Year' body={yearBodyTemplate} />
          </DataTable>
        </div>
      )}
      {audioSource.source === 'track' && (
        <div className='grid'>
          <div className='col-2'>
            <div className='flex flex-column mt-5'>
              <Image src={cover} alt='cover' width='250' height='250' />
              <div className='text-2xl font-italic mt-3'>{audioSource.artist.title}</div>
              <div className='text-2xl'>
                {parseAlbum(audioSource.album.title).album}&nbsp;
                {folders && folders.length > 0 ? `(${folders[0].year})` : ''}
              </div>
            </div>
          </div>
          <div className='col'>
            <DataTable
              value={folders}
              stripedRows
              scrollable
              scrollHeight='75vh'
              paginator
              rows={25}
              rowsPerPageOptions={[10, 25, 50, 100]}
            >
              <Column
                body={
                  <span className='artist-icon'>
                    <FontAwesomeIcon id='fa-music' icon={faMusic} size='xl' />
                  </span>
                }
                style={{ width: '0.5rem' }}
              />
              <Column field='id' header='ID' style={{ width: '5%' }} />
              <Column field='title' header='Title' />
              <Column field='track' header='Track' />
              <Column field='durationString' header='Duration' />
              <Column field='filesizeString' header='File size' />
            </DataTable>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiRequestComponent;
