# PHAN MEM QUAN LY BAN HANG (co LO HANG va GIA VON)

Ung dung quan ly ban hang nhieu nguoi dung. Song ngu: Tieng Viet / 中文

## DIEM DAC BIET: QUAN LY THEO LO HANG

Khi nhap 1 lo hang, ban **khong phai nhap 1 lan**. Co the:
- Tam ung truoc cho NCC
- Tra tien van chuyen sau
- Tra thue sau
- Tra not NCC

**Tat ca cac khoan deu gan vao CUNG 1 MA LO** va tu dong cong don de tinh ra GIA VON.

### Vi du thuc te

```
LO-2026-001 — Cong ty ABC — 10/09/2026

HANG HOA:
  Ao so mi   100 cai x 1.000.000 = 100.000.000
  Quan tay    50 cai x   800.000 =  40.000.000
                       Tien hang: 140.000.000

CAC KHOAN (nhap dan nhieu lan):
  10/09  Tam ung NCC     100.000.000  [Da tra]
  20/09  Van chuyen        2.000.000  [Da tra]
  25/09  Thue VAT          7.000.000  [Chua tra]

  => GIA VON LO: 149.000.000
  => Da tra:     102.000.000
  => Con no NCC:  47.000.000

PHAN BO THEO GIA TRI (tu dong):
  Ao so mi: 149tr x 100/140 = 106.428.571 => 1.064.286/cai
  Quan tay: 149tr x  40/140 =  42.571.429 =>   851.429/cai
```

**Dac diem:**
- Hang vao kho NGAY khi tao lo (ban duoc ngay)
- Gia von tu dong cap nhat moi khi them khoan
- Gia von binh quan duoc luu vao san pham (dung tinh loi nhuan khi ban)
- Co the "Chot lo" de khoa gia von, hoac "Mo lai" neu co phi ve muon

## CHUC NANG KHAC

- **San pham**: ten 2 ngon ngu, ma, don vi, gia von, gia ban
- **Ban hang**: gio hang, giam gia, KHACH TRA TRUOC 1 PHAN
- **Ton kho**: tinh realtime, canh bao hang sap het
- **Khach hang / NCC**: danh ba kem SDT, dia chi
- **Cong no**: phai thu khach / phai tra NCC, thanh toan tung phan
- **In hoa don**: 3 kho giay (80mm, A5, A4)
- **Thu chi**, **Bao cao**, **Nhan vien + phan quyen**

## CAI DAT

### Yeu cau
- Node.js 18 tro len
- Khong can database (dung SQLite)

### Chay tren may
```bash
cd server
npm install --omit=dev
cd ..
PORT=10020 node server/index.js
# Mo http://localhost:10020
```

### Chay vinh vien tren VPS
```bash
npm install -g pm2
cd /duong/dan/qlbh
PORT=10020 DATA_DIR=./data pm2 start server/index.js --name qlbh
pm2 startup && pm2 save
```

## CAU HINH

| Bien | Mac dinh | Mo ta |
|---|---|---|
| PORT | 10020 | Cong chay |
| DATA_DIR | ./data | Thu muc luu qlbh.db |

## DOI MAT KHAU KHI QUEN
```bash
cd server
node reset-password.js <ten_dang_nhap> <mat_khau_moi>
```

## SAO LUU
Toan bo du lieu trong 1 file: `data/qlbh.db` - copy la xong.

## BAO MAT
- Mat khau ma hoa bcrypt
- Moi cua hang tach du lieu hoan toan
- Nhan vien khong xoa duoc du lieu
- Phien dang nhap het han 30 ngay

## CAU TRUC
```
qlbh/
├── server/
│   ├── index.js          API chinh
│   ├── db.js             Database + logic lo hang
│   ├── reset-password.js
│   └── package.json
├── public/
│   ├── index.html
│   ├── style.css
│   └── js/ (i18n, icon, api, app, print)
├── data/                 Du lieu (tu tao)
├── package.json
├── Procfile, railway.json, nixpacks.toml
├── HUONG-DAN-RAILWAY.md
└── HUONG-DAN-VPS.md
```
