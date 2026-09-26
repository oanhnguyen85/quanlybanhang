# HUONG DAN DEPLOY LEN RAILWAY (MIEN PHI)

**Gui cho ky thuat:**

> Dua ung dung Node.js nay len Railway. File `qlbh-online.zip` la ma nguon.
> Thoi gian ~15 phut. Mien phi (Railway tang 5 USD, app chay ~0.5 USD/thang -> ~10 thang).

## BUOC 1 — DUA CODE LEN GITHUB

```bash
unzip qlbh-online.zip
cd qlbh
git init
git add .
git commit -m "Initial commit"
gh repo create quanlybanhang --private --source=. --push
```
Hoac tao repo thu cong tren github.com/new (Private) roi:
```bash
git remote add origin https://github.com/<user>/quanlybanhang.git
git branch -M main
git push -u origin main
```

**Luu y:** Phai upload DUNG cau truc (co 2 thu muc `public/` va `server/`).
Neu keo tha web lam mat cau truc, dung Git command line hoac GitHub Desktop.

## BUOC 2 — DEPLOY RAILWAY

1. Vao https://railway.app -> **Login with GitHub**
2. **New Project -> Deploy from GitHub repo** -> chon repo
3. Cho 1-3 phut den khi hien **Success**

`railway.json` va `nixpacks.toml` da cau hinh san.

## BUOC 3 — ⚠️ TAO VOLUME (BAT BUOC)

1. Service -> **Settings** -> **Volumes** -> **Add Volume**
   - Mount path: `/data`, Size: 1 GB
2. **Variables** -> New Variable
   - Name: `DATA_DIR`, Value: `/data`
3. Railway tu restart

**Neu bo qua buoc nay, du lieu se mat moi khi Railway restart.**

## BUOC 4 — TAO DOMAIN
Settings -> **Networking** -> **Generate Domain** -> nhan link.

## BUOC 5 — KIEM TRA
- [ ] Mo link -> hien man hinh Dang nhap
- [ ] Dang ky cua hang duoc
- [ ] Them san pham, tao lo hang duoc
- [ ] **Restart app -> du lieu van con** (quan trong nhat)

## XU LY SU CO

| Trieu chung | Cach sua |
|---|---|
| Build failed | Kiem tra co `server/package.json` |
| Application failed to respond | Xem tab Logs |
| Du lieu mat sau restart | Chua tao Volume/DATA_DIR |
| better-sqlite3 build fail | Them `python3`, `gcc` vao nixpacks.toml |

## CAP NHAT PHIEN BAN MOI
```bash
git add . && git commit -m "Update" && git push
```
Railway tu deploy lai. Du lieu khong mat.
