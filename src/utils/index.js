/* eslint-disable camelcase */
const mapAlbumDBToModel = ({ cover_url, ...args }) => ({
  ...args,
  coverUrl: cover_url,
});

const mapSongDBToModel = ({ album_id, ...args }) => ({
  ...args,
  albumId: album_id,
});

module.exports = { mapAlbumDBToModel, mapSongDBToModel };
