import React from 'react';
import { IFolder } from '../model/folder';
import { ToggleButton } from 'primereact/togglebutton';
import { Tag } from 'primereact/tag';

interface IArtistLettersProps {
  folders: IFolder[];
  artistBodyTemplate: (folder: IFolder) => JSX.Element;
  selectedLetter: string;
  selectedLetterClick: (letter: string) => void;
}

const ArtistLetters: React.FC<IArtistLettersProps> = ({ folders, artistBodyTemplate, selectedLetter, selectedLetterClick }) => {
  const testFirstLetter = (title: string, selectedLetter: string): boolean => {
    const firstLetterRegex = (letter: string): RegExp => new RegExp(`^(?:${letter.toUpperCase()})`);

    if (selectedLetter === '1') return /[0-9]/.test(title.charAt(0));

    let firstLetter = title.replace("'", '').charAt(0).toLocaleUpperCase();
    firstLetter = firstLetter.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // remove accents - <see="https://www.codu.co/articles/remove-accents-from-a-javascript-string-skgp1inb"/>
    firstLetter = firstLetter.replace('Ø', 'O'); // fix some special characters

    return /[a-z]/.test(selectedLetter)
      ? firstLetterRegex(selectedLetter).test(firstLetter)
      : !/[a-z0-9]/i.test(firstLetter);
  };

  return (
    <>
      <div className='flex column-gap-2 mb-5'>
        {['1', ...[...Array(26).keys()].map(i => String.fromCharCode(i + 97)), '高'].map(letter => (
          <ToggleButton
            key={letter}
            className='w-3rem'
            onLabel={letter}
            offLabel={letter}
            checked={selectedLetter === letter}
            onChange={_ => selectedLetterClick(letter)}
          />
        ))}
      </div>
      <div className='flex flex-wrap column-gap-1 row-gap-2'>
        {folders
          .filter(folder => testFirstLetter(folder.title, selectedLetter))
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
  );
};

export default ArtistLetters;
