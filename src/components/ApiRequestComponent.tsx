import axios from 'axios';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import React, { useEffect, useState } from 'react';
import config from '../config.json';
import { IFolder } from '../model/folder';
import { InputText } from 'primereact/inputtext';
import './ApiRequestComponent.scss';
import { ToggleButton } from 'primereact/togglebutton';

interface AudioSource {
  dirId: { [key: string]: string };
  artist?: string;
  source: 'artist' | 'album' | 'track';
}

const yearAlbumRegex = /^(?:\[([^\[]*)\]\s*)?(.+)$/;

const ApiRequestComponent: React.FC = () => {
  const [folders, setFolders] = useState<IFolder[]>([]);
  const [sid, setSid] = useState<string>('');
  const [audioSource, setAudioSource] = useState<AudioSource>({
    dirId: {},
    source: 'artist',
  });
  const [checked, setChecked] = useState<boolean>(false);
  const [selectedLetter, setSelectedLetter] = useState<string>('a');

  const tableRef = React.createRef<DataTable<IFolder[]>>();

  const artistBodyTemplate = (rowData: IFolder) => {
    const onArtistClick = (): void => {
      setFolders([]);
      setAudioSource(prevState => {
        const _audioSource = {
          artist: rowData.title,
          source: 'album',
        } as AudioSource;
        prevState.dirId['artist'] = rowData.id;
        return { ..._audioSource, dirId: prevState.dirId };
      });
      tableRef.current?.saveState();
    };

    return (
      <a id='tableLink' onClick={() => onArtistClick()}>
        {rowData.title}
      </a>
    );
  };

  const albumArtistBodyTemplate = () => <span>{audioSource.artist}</span>;

  const parseAlbum = (album: string | undefined): { album: string; year: string } => {
    const match = yearAlbumRegex.exec(album || '');
    return {
      album: match ? match[2] : '',
      year: match ? match[1] : '',
    };
  };

  const albumBodyTemplate = (rowData: IFolder) => {
    const onAlbumClick = (): void => {
      setAudioSource(prevState => {
        const _audioSource = {
          artist: prevState.artist,
          source: 'track',
        } as AudioSource;
        prevState.dirId['album'] = rowData.id;
        return { ..._audioSource, dirId: prevState.dirId };
      });
    };
    const album = parseAlbum(rowData.title).album;
    return (
      <a id='tableLink' onClick={() => onAlbumClick()}>
        {album}
      </a>
    );
  };

  const yearBodyTemplate = (rowData: IFolder) => {
    const year = parseAlbum(rowData.title).year;
    return <span>{year}</span>;
  };

  const getFolders = async (dirId?: string): Promise<IFolder[]> => {
    let url = `${config.baseUrl}/folder`;
    if (dirId) url += `?dirId=${dirId}`;
    const response = await axios.get(url);
    let _folders = response.data as IFolder[];
    return _folders;
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
        let _folders = await getFolders();
        setFolders(_folders);
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
        let _folders = await getFolders(audioSource.dirId['artist']);
        setFolders(_folders);
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
        let _folders = await getFolders(audioSource.dirId['album']);
        _folders = _folders.sort(
          (a, b) =>
            (a.album || '').localeCompare(b.album || '') ||
            (a.disc || 0) - (b.disc || 0) ||
            (a.track || 0) - (b.track || 0)
        );
        setFolders(_folders);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [audioSource]);

  const onBackClick = (): void => {
    setFolders([]);
    if (audioSource.source === 'track') {
      setAudioSource(prevState => ({
        ...prevState,
        source: 'album',
      }));
    } else if (audioSource.source === 'album') {
      setAudioSource(() => ({
        dirId: {},
        source: 'artist',
      }));
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
          <a id='back' onClick={() => onBackClick()}>
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
                    <div
                      key={folder.id}
                      className={`w-auto text-lg p-2 border-round${index % 2 === 0 ? ' bg-primary-300 text-white' : ''}`}
                    >
                      {artistBodyTemplate(folder)}
                    </div>
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
              <Column field='id' header='ID' style={{ width: '5%' }} />
              <Column header='Artist' body={artistBodyTemplate} />
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
          <Column field='id' header='ID' style={{ width: '5%' }} />
          <Column header='Artist' body={albumArtistBodyTemplate} />
          <Column header='Album' body={albumBodyTemplate} />
          <Column header='Year' body={yearBodyTemplate} />
        </DataTable>
      )}
      {audioSource.source === 'track' && (
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
          <Column field='id' header='ID' style={{ width: '5%' }} />
          <Column field='artist' header='Artist' />
          <Column field='album' header='Album' />
          <Column field='year' header='Year' />
          <Column field='disc' header='Disc' />
          <Column field='track' header='Track' />
          <Column field='durationString' header='Duration' />
          <Column field='filesizeString' header='File size' />
        </DataTable>
      )}
    </div>
  );
};

export default ApiRequestComponent;
