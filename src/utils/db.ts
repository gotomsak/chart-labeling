// import sqlite3 from 'sqlite3';
// import { open } from 'sqlite';

// export async function openDB() {
//   return open({
//     filename: '../../database/chart-labeling.sqlite',
//     driver: sqlite3.Database,
//   });
// }


import { Sequelize } from 'sequelize';

// SQLite データベースに接続
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: '../../database/chart-labeling.sqlite' // データベースファイルのパス
});

export default sequelize;
