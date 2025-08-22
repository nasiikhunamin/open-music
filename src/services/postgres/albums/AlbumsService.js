const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../../exceptions/InvariantError');
const NotFoundError = require('../../../exceptions/NotFoundError');

class AlbumsService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addAlbum({ name, year }) {
    const id = nanoid(16);
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3, $4, $5) RETURNING id',
      values: [id, name, year, createdAt, updatedAt],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Album gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getAlbumById(id) {
    try {
      const result = await this._cacheService.get(`album:${id}`);
      return JSON.parse(result);
    } catch (error) {
      const albumQuery = {
        text: 'SELECT id, name, year, cover AS "coverUrl" FROM albums WHERE id = $1',
        values: [id],
      };
      const albumResult = await this._pool.query(albumQuery);
      if (!albumResult.rowCount) {
        throw new NotFoundError('Album tidak ditemukan');
      }

      const songsQuery = {
        text: 'SELECT id, title, performer FROM songs WHERE album_id = $1',
        values: [id],
      };
      const songsResult = await this._pool.query(songsQuery);

      const album = albumResult.rows[0];
      album.songs = songsResult.rows;

      await this._cacheService.set(`album:${id}`, JSON.stringify(album));

      return album;
    }
  }

  async editAlbumById(id, { name, year }) {
    const updateAt = new Date().toISOString();
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2, updated_at = $3 WHERE id = $4 RETURNING id',
      values: [name, year, updateAt, id],
    };

    const { rowCount } = await this._pool.query(query);

    if (!rowCount) {
      throw new NotFoundError('Gagal memperbarui album, Id tidak ditemukan');
    }

    await this._cacheService.delete(`album:${id}`);
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id],
    };

    const { rowCount } = await this._pool.query(query);

    if (!rowCount) {
      throw new NotFoundError('Album gagal dihapus. Id tidak ditemukan');
    }

    await this._cacheService.delete(`album:${id}`);
  }

  async addAlbumCover(albumId, coverUrl) {
    const query = {
      text: 'UPDATE albums SET cover = $1 WHERE id = $2 RETURNING id',
      values: [coverUrl, albumId],
    };
    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError(
        'Gagal menambahkan sampul. Album tidak ditemukan',
      );
    }

    await this._cacheService.delete(`album:${albumId}`);
  }

  async addAlbumLike(albumId, userId) {
    await this.getAlbumById(albumId);

    const checkQuery = {
      text: 'SELECT id FROM user_album_likes WHERE user_id = $1 AND album_id = $2',
      values: [userId, albumId],
    };

    const checkResult = await this._pool.query(checkQuery);

    if (checkResult.rowCount > 0) {
      throw new InvariantError('Anda sudah menyukai album ini');
    }

    const id = `like-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO user_album_likes (id, user_id, album_id) VALUES ($1, $2, $3) RETURNING id',
      values: [id, userId, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Gagal menyukai album');
    }

    await this._cacheService.delete(`album-likes:${albumId}`);
  }

  async deleteAlbumLike(albumId, userId) {
    const query = {
      text: 'DELETE FROM user_album_likes WHERE album_id = $1 AND user_id = $2 RETURNING id',
      values: [albumId, userId],
    };

    const { rowCount } = await this._pool.query(query);

    if (!rowCount) {
      throw new InvariantError('Gagal batal menyukai album');
    }

    await this._cacheService.delete(`album-likes:${albumId}`);
  }

  async getAlbumLikes(albumId) {
    try {
      const result = await this._cacheService.get(`album-likes:${albumId}`);
      return { count: JSON.parse(result), fromCache: true };
    } catch (error) {
      await this.getAlbumById(albumId);

      const query = {
        text: 'SELECT COUNT(id) FROM user_album_likes WHERE album_id = $1',
        values: [albumId],
      };

      const result = await this._pool.query(query);
      const likesCount = parseInt(result.rows[0].count, 10);

      await this._cacheService.set(
        `album-likes:${albumId}`,
        JSON.stringify(likesCount),
      );

      return { count: likesCount, fromCache: false };
    }
  }
}

module.exports = AlbumsService;
