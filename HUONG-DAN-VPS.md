# HUONG DAN CAI TREN VPS

**Gui cho nhan vien ky thuat / nguoi cai giup:**

> Nho anh/chi cai ung dung Node.js nay len VPS. File `qlbh-online.zip` la ma nguon.
> Thoi gian: ~20 phut.

## THONG TIN UNG DUNG

| Muc | Gia tri |
|---|---|
| Loai | Web app Node.js + Express |
| Database | SQLite (tu tao, khong can cai) |
| Node | >= 18 |
| Cong | process.env.PORT (mac dinh 10020) |
| Du lieu | process.env.DATA_DIR (mac dinh ./data) |

## CAC BUOC

### 1. Cai Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs build-essential
node -v    # phai >= 18
```

### 2. Giai nen
```bash
cd /var/www
unzip qlbh-online.zip
cd qlbh
```

### 3. Cai thu vien
```bash
cd server
npm install --omit=dev
cd ..
```
(mat 1-2 phut)

### 4. Chay thu
```bash
PORT=10020 node server/index.js
```
Mo `http://IP_VPS:10020` -> phai thay man hinh Dang nhap. Ctrl+C de dung.

### 5. Chay vinh vien bang PM2
```bash
npm install -g pm2
cd /var/www/qlbh
PORT=10020 DATA_DIR=/var/www/qlbh/data pm2 start server/index.js --name qlbh
pm2 startup
pm2 save
pm2 status
```

### 6. Mo firewall
```bash
sudo ufw allow 10020
```

## (TUY CHON) TEN MIEN + HTTPS
```bash
sudo apt install -y nginx
sudo tee /etc/nginx/sites-available/qlbh > /dev/null <<'NGINX'
server {
    listen 80;
    server_name shop.tenmienkhach.com;
    location / {
        proxy_pass http://127.0.0.1:10020;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX
sudo ln -sf /etc/nginx/sites-available/qlbh /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d shop.tenmienkhach.com
```

## SAO LUU
Du lieu trong 1 file: `data/qlbh.db`
```bash
cd /var/www/qlbh && tar czf ~/backup-$(date +%Y%m%d).tar.gz data/
```

## CAP NHAT PHIEN BAN MOI
1. Giai nen ZIP moi
2. Copy de thu muc `public/` va `server/` (KHONG xoa `data/`)
3. `cd server && npm install --omit=dev && cd .. && pm2 restart qlbh`

## XU LY SU CO

| Trieu chung | Cach sua |
|---|---|
| Khong truy cap duoc | `sudo ufw allow 10020` |
| Loi EADDRINUSE | Doi PORT khac (10021) |
| Trang trang | Kiem tra giai nen du `public/` |
| Loi better-sqlite3 | `sudo apt install -y build-essential python3` |
| Quen mat khau | `cd server && node reset-password.js <user> <pass>` |

## KIEM TRA HOAN THANH
- [ ] Node >= 18
- [ ] npm install thanh cong
- [ ] Mo duoc trang Dang nhap
- [ ] pm2 status hien online
- [ ] pm2 save da chay
- [ ] Truy cap tu ngoai internet duoc
- [ ] Dang ky cua hang OK
- [ ] pm2 restart qlbh -> du lieu van con
