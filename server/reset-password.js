'use strict';
const bcrypt = require('bcryptjs');
const D = require('./db');
var a = process.argv.slice(2);
if (a.length < 2) { console.log('Cach dung: node reset-password.js <ten_dang_nhap> <mat_khau_moi>'); process.exit(1); }
if (a[1].length < 6) { console.log('Loi: mat khau can it nhat 6 ky tu'); process.exit(1); }
var u = D.Users.byUsername(a[0]);
if (!u) { console.log('Khong tim thay nguoi dung: ' + a[0]); process.exit(1); }
D.Users.setPassword(u.id, bcrypt.hashSync(a[1], 10));
console.log('Da doi mat khau cho "' + (u.display || u.username) + '" (@' + u.username + ')');
