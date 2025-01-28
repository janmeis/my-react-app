
import React from 'react';
import { IAudioSource } from './ApiRequestComponent';

interface IBreadcrumbProps {
  audioSource: IAudioSource;
  parseAlbum: (album: string | undefined) => { album: string; year: string };
  linkClick: () => void;
}

const Breadcrumb: React.FC<IBreadcrumbProps> = ({ audioSource, parseAlbum, linkClick }) => (
  <div className='mb-5'>
    {audioSource.source !== 'artist' && (
      <div id='breadcrumb' className='flex justify-content-left mb-3'>
        {audioSource.source === 'album' && (
          <>
            <a
              id='artist-lnk'
              className='pi pi-angle-right mr-3'
              style={{ fontSize: '2.5rem' }}
              onClick={_ => linkClick()}
            />
            <div className='text-4xl'>{audioSource.artist.title}</div>
          </>
        )}
        {audioSource.source !== 'album' && (
          <>
            <div id='artist-lnk' className='pi pi-angle-right mr-3' style={{ fontSize: '2.5rem' }} />
            <div className='text-4xl'>{audioSource.artist.title}</div>
            <a
              id='album-lnk'
              className='pi pi-angle-right ml-3 mr-3'
              style={{ fontSize: '2.5rem' }}
              onClick={_ => linkClick()}
            />
            <div className='text-4xl'>{parseAlbum(audioSource.album.title).album}</div>
          </>
        )}
      </div>
    )}
  </div>
);

export default Breadcrumb;