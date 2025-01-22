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
import { Tag } from 'primereact/tag';
import { Image } from 'primereact/image';

interface AudioSource {
  artist: IFolder;
  album: IFolder;
  source: 'artist' | 'album' | 'track';
}

const yearAlbumRegex = /^(?:\[([^\[]*)\]\s*)?(.+)$/;

const ApiRequestComponent: React.FC = () => {
  const [folders, setFolders] = useState<IFolder[]>([]);
  const [sid, setSid] = useState<string>('');
  const [audioSource, setAudioSource] = useState<AudioSource>({
    artist: {} as IFolder,
    album: {} as IFolder,
    source: 'artist',
  } as AudioSource);
  const [checked, setChecked] = useState<boolean>(false);
  const [selectedLetter, setSelectedLetter] = useState<string>('a');
  const [cover, setCover] = useState<string>('');

  const tableRef = React.createRef<DataTable<IFolder[]>>();

  const onArtistClick = (rowData: IFolder): void => {
    setFolders([]);
    setAudioSource(_ => ({ artist: rowData, album: {} as IFolder, source: 'album' }) as AudioSource);
    tableRef.current?.saveState();
  };

  const iconBodyTemplate = (rowData: IFolder, onClick: (rowData: IFolder) => void) => (
    <a className='artist-icon' onClick={_ => onClick(rowData)}>
      <FontAwesomeIcon id='fa-folder' icon={faFolder} size='lg' />
      <FontAwesomeIcon id='fa-folder-open' icon={faFolderOpen} size='lg' />
    </a>
  );

  const artistBodyTemplate = (rowData: IFolder) => (
    <a id='tableLink' onClick={_ => onArtistClick(rowData)}>
      {rowData.title}
    </a>
  );

  const albumArtistBodyTemplate = () => <span>{audioSource.artist.title}</span>;

  const parseAlbum = (album: string | undefined): { album: string; year: string } => {
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

  const albumBodyTemplate = (rowData: IFolder) => {
    const album = parseAlbum(rowData.title).album;
    return (
      <a id='tableLink' onClick={_ => onAlbumClick(rowData)}>
        {album}
      </a>
    );
  };

  const yearBodyTemplate = (rowData: IFolder) => {
    const year = parseAlbum(rowData.title).year;
    return <span>{year}</span>;
  };

  const getFolders = async (dirId?: string): Promise<{ total: number; cover: string; folders: IFolder[] }> => {
    let url = `${config.baseUrl}/folder`;
    if (dirId) url += `?dirId=${dirId}`;
    const response = await axios.get(url);
    let _folders = response.data.folders as IFolder[];
    return { total: response.data.total, cover: response.data.cover, folders: _folders };
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
  }, [sid, audioSource]);

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
        setCover(response.cover);
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

  const getLetterRegex = (letter: string): RegExp => new RegExp(`^(?:${letter}|${letter.toUpperCase()})`);

  return (
    <div>
      <div id='sidDiv'>
        <label htmlFor='sid'>sid</label>
        <InputText type='text' className='p-inputtext' id='sid' name='sid' value={sid} disabled />
      </div>

      <h3>
        {audioSource.source !== 'artist' && (
          <a id='back' onClick={_ => onBackClick()}>
            <i className='pi pi-arrow-left' />
          </a>
        )}
      </h3>
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
            <>
              <div className='flex column-gap-2 mb-5'>
                {[...Array(26).keys()]
                  .map(i => String.fromCharCode(i + 97))
                  .map(letter => (
                    <ToggleButton
                      key={letter}
                      className='w-3rem'
                      onLabel={letter}
                      offLabel={letter}
                      checked={selectedLetter === letter}
                      onChange={_ => setSelectedLetter(letter)}
                    />
                  ))}
              </div>
              <div className='flex flex-wrap column-gap-1 row-gap-2'>
                {folders
                  .filter(folder => getLetterRegex(selectedLetter).test(folder.title))
                  .map((folder, index) => (
                    <Tag
                      id='artist-tag'
                      key={folder.id}
                      severity={`${index % 2 === 0 ? 'secondary' : 'success'}`}
                      value={artistBodyTemplate(folder)}
                      className='text-lg text-white p-2'
                    />
                  ))}
              </div>
            </>
          )}
          {!checked && (
            <DataTable
              value={folders}
              stripedRows
              scrollable
              scrollHeight='75vh'
              paginator
              rows={25}
              rowsPerPageOptions={[10, 25, 50, 100]}
              tableStyle={{ minWidth: '50rem' }}
              ref={tableRef}
            >
              <Column body={rowData => iconBodyTemplate(rowData, onArtistClick)} style={{ width: '0.35rem' }} />
              <Column field='id' header='ID' style={{ width: '5%' }} />
              <Column header='Artist' body={rowData => artistBodyTemplate(rowData)} />
            </DataTable>
          )}
        </>
      )}
      {audioSource.source === 'album' && (
        <DataTable
          value={folders}
          stripedRows
          scrollable
          scrollHeight='75vh'
          paginator
          rows={25}
          rowsPerPageOptions={[10, 25, 50, 100]}
          tableStyle={{ minWidth: '50rem' }}
        >
          <Column body={rowData => iconBodyTemplate(rowData, onAlbumClick)} style={{ width: '0.35rem' }} />
          <Column field='id' header='ID' style={{ width: '5%' }} />
          <Column header='Artist' body={albumArtistBodyTemplate} />
          <Column header='Album' body={albumBodyTemplate} />
          <Column header='Year' body={yearBodyTemplate} />
        </DataTable>
      )}
      {audioSource.source === 'track' && (
        <div className='grid'>
          <div className='col-2'>
            <Image src={cover} alt='cover' width='350' height='350' />
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
              tableStyle={{ minWidth: '50rem' }}
            >
              <Column
                body={
                  <span className='artist-icon'>
                    <FontAwesomeIcon id='fa-music' icon={faMusic} size='lg' />
                  </span>
                }
                style={{ width: '0.5rem' }}
              />
              <Column field='id' header='ID' style={{ width: '5%' }} />
              <Column field='artist' header='Artist' />
              <Column field='album' header='Album' />
              <Column field='year' header='Year' />
              <Column field='title' header='Title' />
              {/* <Column field='disc' header='Disc' /> */}
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
