/* eslint-disable camelcase */
const mapAlbumDBToModel = ({ id, name, year }) => ({
  id,
  name,
  year,
});

const mapSongDBToModel = ({ album_id, ...args }) => ({
  ...args,
  albumId: album_id,
});

module.exports = { mapAlbumDBToModel, mapSongDBToModel };
