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
  year?: number;
}
