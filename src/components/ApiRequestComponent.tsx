import axios from 'axios';
import { Column } from 'primereact/column';
import { DataTable, DataTableStateEvent } from 'primereact/datatable';
import React, { createRef, useContext, useEffect, useState } from 'react';
import config from '../config.json';
import { IFolder } from '../model/folder';
import { InputText } from 'primereact/inputtext';
import './ApiRequestComponent.scss';
import { ToggleButton } from 'primereact/togglebutton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMusic, faFolder, faFolderOpen } from '@fortawesome/free-solid-svg-icons';
import { Image } from 'primereact/image';
import Breadcrumb from './Breadcrumb';
import ArtistLetters from './ArtistLetters';
import { Dropdown } from 'primereact/dropdown';
import { AppContext } from '../contexts/AppContext';

export interface IAudioSource {
  artist: IFolder;
  album: IFolder;
  source: 'artist' | 'album' | 'track';
}

const ApiRequestComponent: React.FC = () => {
  const appContext = useContext(AppContext);
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
  const [pagination, setPagination] = useState<DataTableStateEvent>({
    first: 0,
    rows: 25,
    pageCount: 0,
  } as DataTableStateEvent);
  const [paginatorLeftOptions, setPaginatorLeftOptions] = useState<string[]>([]);
  const rowsPerPageOptions = [10, 25, 50, 100];
  const tableRef = createRef<DataTable<IFolder[]>>();
  const pageRowsRegex = /\/artist\/(\d+)\/(\d+)/;

  setTimeout(() => setIsSidDisplayed(false), 5000);

  const parseUrl = (url: string): { protocol: string; hostname: string; port: string } => {
    const urlRegex = /^(https?:\/\/)?([^:/\s]+)(?:(:\d+))?/;
    const [, protocol, hostname, port] = urlRegex.exec(url) || [];

    if (!protocol) return { protocol: 'http://', hostname: 'localhost', port: '' };
    return { protocol, hostname, port };
  };

  const baseUrl = `${location.protocol}//${location.hostname}${parseUrl(config.baseUrl).port}`;

  const onArtistClick = (rowData: IFolder): void => {
    setFolders([]);
    setAudioSource(_ => ({ artist: rowData, album: {} as IFolder, source: 'album' }) as IAudioSource);
  };

  const iconBodyTemplate = (rowData: IFolder, onClick: (rowData: IFolder) => void): JSX.Element => (
    <a className="artist-icon" onClick={_ => onClick(rowData)}>
      <FontAwesomeIcon id="fa-folder" icon={faFolder} size="xl" />
      <FontAwesomeIcon id="fa-folder-open" icon={faFolderOpen} size="xl" />
    </a>
  );

  const artistBodyTemplate = (rowData: IFolder): JSX.Element => (
    <a id="tableLink" onClick={_ => onArtistClick(rowData)}>
      {rowData.title}
    </a>
  );

  const parseAlbum = (album: string | undefined): { album: string; year: string } => {
    const yearAlbumRegex = /^(?:\[([^[]*)\]\s*)?(.+)$/;
    const match = yearAlbumRegex.exec(album || '');
    return {
      album: match ? match[2] : '',
      year: match ? match[1] : '',
    };
  };

  const onAlbumClick = (rowData: IFolder): void => {
    setFolders([]);
    setAudioSource(prevState => ({ ...prevState, album: rowData, source: 'track' }));
  };

  const albumBodyTemplate = (rowData: IFolder): JSX.Element => {
    const album = parseAlbum(rowData.title).album;
    return (
      <a id="tableLink" onClick={_ => onAlbumClick(rowData)}>
        {album}
      </a>
    );
  };

  const yearBodyTemplate = (rowData: IFolder): JSX.Element => {
    const year = parseAlbum(rowData.title).year;
    return <span>{year}</span>;
  };

  const parseCover = (coverUrl: string | null): string => {
    if (!coverUrl) return '';
    if (location.hostname === 'localhost') return coverUrl;

    const { hostname } = parseUrl(coverUrl);
    const _result = coverUrl.replace(hostname, location.hostname);
    return _result;
  };

  const sortFolders = (audioSource: IAudioSource, folders: IFolder[]): IFolder[] => {
    if (audioSource.source !== 'track') return folders;
    return folders.sort((a, b) => (a.album || '').localeCompare(b.album || '') || (a.disc || 0) - (b.disc || 0) || (a.track || 0) - (b.track || 0));
  };

  const getFolders = async (audioSource: IAudioSource): Promise<{ total: number; cover: string; folders: IFolder[] }> => {
    let url = `${baseUrl}/folder`;
    const dirId = audioSource.source === 'artist' ? null : audioSource.source === 'album' ? audioSource.artist.id : audioSource.album.id;
    if (dirId) url += `?dirId=${dirId}`;
    const response = await axios.get(url);
    const _folders = sortFolders(audioSource, response.data.folders);
    const _cover = parseCover(response.data.cover);
    return { total: response.data.total, cover: _cover, folders: _folders };
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getPaginatorLeftOptions = (pageCount: number): string[] => [...Array(pageCount).keys()].map(i => `${i + 1}`);

  const resetPagination = (rowsTotal: number): void => {
    const [, page, rows] = [...(location.pathname.match(pageRowsRegex) || [])].map(x => +x);
    let _pagination = {} as DataTableStateEvent;
    if (audioSource.source === 'artist') {
      const _page = page || appContext?.currentPage || 1;
      const _rows = rows || appContext?.rowsPerPage || 25;
      const _pageCount = Math.ceil(rowsTotal / _rows);
      _pagination = {
        ...pagination,
        first: (_page - 1) * _rows,
        rows: _rows,
        pageCount: _pageCount,
        totalRecords: rowsTotal,
      };
      if (!page || page != _page || !rows || rows != _rows) {
        const _url = `${location.origin}/artist/${_page}/${_rows}`;
        window.history.pushState({}, '', _url);
      }
    } else {
      const _pageCount = Math.ceil(rowsTotal / (appContext?.rowsPerPage || 25));
      _pagination = {
        ...pagination,
        first: appContext?.firstRow || 0,
        rows: appContext?.rowsPerPage || 25,
        pageCount: _pageCount,
        totalRecords: rowsTotal,
      };
    }

    setPagination(_pagination);
    setPaginatorLeftOptions(getPaginatorLeftOptions(_pagination.pageCount!));

    if (!page || !rows || audioSource.source !== 'artist') tableRef.current?.resetScroll();
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getFolders(audioSource);
        resetPagination(response.total);
        setCover(response.cover);
        const folders = sortFolders(audioSource, response.folders);
        setFolders(_ => folders);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioSource]);

  const onBackClick = (): void => {
    setFolders([]);
    if (audioSource.source === 'track') {
      setAudioSource(prevState => ({ ...prevState, album: {} as IFolder, source: 'album' }));
    } else if (audioSource.source === 'album') {
      setAudioSource(_ => ({ artist: {} as IFolder, album: {} as IFolder, source: 'artist' }));
    }
  };

  const onPage = (event: DataTableStateEvent) => {
    if (audioSource.source === 'artist') {
      const _url = `/artist/${event.first / event.rows + 1}/${event.rows}`;
      window.history.pushState({}, '', _url);
    }
    if (event.rows !== pagination.rows) setPaginatorLeftOptions(getPaginatorLeftOptions(Math.ceil(folders.length / event.rows)));
    setPagination({ ...event, totalRecords: pagination.totalRecords });
  };

  const visibleColumns = (audioSource: IAudioSource): { field?: string; header?: string; body?: (rowData: IFolder) => JSX.Element }[] => {
    switch (audioSource.source) {
      case 'artist':
        return [
          { body: rowData => iconBodyTemplate(rowData, onArtistClick) },
          { field: 'id', header: 'ID' },
          { field: 'title', header: 'Artist', body: artistBodyTemplate },
        ];
      case 'album':
        return [
          { body: rowData => iconBodyTemplate(rowData, onAlbumClick) },
          { field: 'id', header: 'ID' },
          { field: 'title', header: 'Album', body: albumBodyTemplate },
          { field: 'year', header: 'Year', body: yearBodyTemplate },
        ];
      case 'track':
        return [
          {
            body: _ => (
              <span className="artist-icon">
                <FontAwesomeIcon id="fa-music" icon={faMusic} size="xl" />
              </span>
            ),
          },
          { field: 'id', header: 'ID' },
          { field: 'title', header: 'Title' },
          { field: 'track', header: 'Track' },
          { field: 'durationString', header: 'Duration' },
          { field: 'filesizeString', header: 'File size' },
        ];
      default:
        return [];
    }
  };

  const paginatorLeftTemplate =
    audioSource.source === 'artist' ? (
      <Dropdown
        value={`${pagination.first / pagination.rows + 1}`}
        onChange={e => onPage({ ...pagination, first: (+e.value - 1) * pagination.rows })}
        options={paginatorLeftOptions}
      />
    ) : (
      <span></span>
    );

  const paginatorRightTemplate = <span>{pagination.totalRecords ? `Total records: ${pagination.totalRecords}` : ''}</span>;

  const dataTableTemplate = (audioSource: IAudioSource, rowData: IFolder[]): JSX.Element => (
    <DataTable
      value={rowData}
      stripedRows
      scrollable
      scrollHeight="75vh"
      dataKey="id"
      loading={rowData.length === 0}
      paginator
      rows={pagination.rows}
      first={pagination.first}
      onPage={onPage}
      rowsPerPageOptions={rowsPerPageOptions}
      paginatorLeft={paginatorLeftTemplate}
      paginatorRight={paginatorRightTemplate}
      alwaysShowPaginator={false}
      ref={tableRef}
    >
      {visibleColumns(audioSource).map((column, index) => (
        <Column key={index} body={column.body} field={column.field} header={column.header} />
      ))}
    </DataTable>
  );

  return (
    <div>
      <div id="sidDiv" style={{ display: isSidDisplayed ? 'block' : 'none' }}>
        <label htmlFor="sid">sid</label>
        <InputText type="text" className="p-inputtext" id="sid" name="sid" value={sid} disabled />
      </div>

      <Breadcrumb audioSource={audioSource} parseAlbum={parseAlbum} linkClick={onBackClick} />

      {audioSource.source === 'artist' && (
        <>
          <div className="flex justify-content-left mb-3">
            <ToggleButton
              onLabel=""
              offLabel=""
              onIcon="pi pi-table"
              offIcon="pi pi-bars"
              checked={checked}
              onChange={e => setChecked(e.value)}
              className="w-5rem text-3xl"
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
        </>
      )}
      {(audioSource.source !== 'artist' || !checked) && (
        <div className="grid">
          {audioSource.source !== 'artist' && (
            <div className="col-fixed">
              <div className="flex flex-column mt-7">
                {cover && (
                  <>
                    <Image src={cover} alt="cover" width="250" height="250" />
                    {(audioSource.source === 'track' && (
                      <>
                        <div className="text-2xl font-italic mt-3">{audioSource.artist.title}</div>
                        <div className="text-2xl">
                          {parseAlbum(audioSource.album.title).album}&nbsp;
                          {folders && folders.length > 0 ? `(${folders[0].year})` : ''}
                        </div>
                      </>
                    )) || (
                      <>
                        <div className="text-2xl mt-3">Albums of</div>
                        <div className="text-2xl font-italic">
                          {audioSource.artist.title}&nbsp;
                          {pagination.totalRecords ? `(${pagination.totalRecords})` : ''}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
          <div className="col">{dataTableTemplate(audioSource, folders)}</div>
        </div>
      )}
    </div>
  );
};

export default ApiRequestComponent;
