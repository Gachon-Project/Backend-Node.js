var mysql = require('mysql');
var db = mysql.createConnection({
    host: 'AWS RDS DB 엔드포인트',
    user: '유저 id',
    password: '유저 비밀번호',
    database: 'DB Schema'
});
db.connect();

module.exports = db;