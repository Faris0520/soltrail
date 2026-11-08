# Brief demo SolTrail

Untuk orang yang memegang layar. Nama tombol di bawah sama dengan teks di aplikasi.

Yang jurinya perlu lihat: satu catatan Memo ditandatangani di wallet, lalu SolTrail membacanya kembali dari Devnet. Skor di browser hanya catatan lokal. Buktinya ada di halaman proof dan di Solana Explorer.

Sediakan sekitar empat menit untuk jalur penuh, kalau airdrop cepat. RPC yang lambat menambah waktu. Kalau slot demo lebih pendek, pakai jalur singkat di bawah.

## Sebelum naik

- Phantom terpasang di browser yang akan dipakai.
- Di Phantom: avatar kiri atas, Settings, Developer Settings, nyalakan Testnet Mode, pilih Solana Devnet. Banner testnet harus terlihat. Langkah ini mengikuti [bantuan Phantom untuk testnet](https://help.phantom.com/articles/use-testnets-in-phantom-5997313271699).
- Coba **Request an airdrop** sekali sebelum sesi. Kalau Devnet menolak karena batas permintaan, buka [faucet.solana.com](https://faucet.solana.com/) dan pakai jalur faucet saat demo.
- Kalau origin ini sudah menyimpan progres, hapus data situs untuk origin itu, atau pakai profil browser yang kosong. Jika tidak, quest sudah terbuka dan demo tidak mulai dari nol.
- Jalankan `npm run dev`, buka http://localhost:3000.
- Perbesar jendela. Izinkan popup Phantom.

## Jalur penuh

Mulai dari browser yang belum punya progres SolTrail.

### Buka

Ucapkan: "SolTrail membawa orang baru melewati Devnet, satu stage dalam satu waktu. Stage berikutnya terkunci sampai stage ini beres."

Klik **Open the quests**.

Layar: judul Quests, skor `0 / 1600 XP`, enam kartu. Wallet Basics berstatus Ready. Kartu quest yang sedang dikerjakan berbingkai warna iris.

### Wallet Basics

Klik kartu **Wallet Basics**. Panel kerja ada di bawah daftar stage.

1. Klik **Connect Phantom**. Setujui di popup wallet. Stage Connect menjadi Cleared. Kalau nama wallet bukan Phantom, tombolnya **Connect** diikuti nama wallet itu.
2. Klik **Show the full address**. Alamat publik muncul utuh.
3. Klik **Read my balance**. Saldo tampil dalam SOL dan lamports.

Ucapkan: "Aplikasi hanya menerima alamat publik. Private key tidak diminta, dan tanda tangan terjadi di wallet."

Klik **Open Devnet SOL**.

### Devnet SOL

1. Klik **Note my starting balance**. Angka lamports awal tercatat.
2. Klik **Request an airdrop**. Tunggu teks `Airdrop signature:`. Permintaan ini 1 SOL.
3. Klik **Check that it arrived**. Stage ini beres hanya jika saldo lebih tinggi dari angka awal, atau signature airdrop sudah confirmed.

Kalau airdrop ditolak, klik **Open the public faucet**, kirim SOL ke alamat yang ada di layar, kembali, lalu klik **Check that it arrived** lagi. Membuka faucet menandai stage "Get practice SOL" selesai. Stage berikutnya tetap menunggu saldo benar-benar naik.

Klik **Open First Message**.

### First Message

Ini bagian yang ditonton.

1. Klik **Use this note**. Catatan di layar berbentuk `SOLTRAIL|QUEST=HELLO_SOLANA|ID=` diikuti UUID.
2. Ucapkan: "Catatannya ada di halaman sebelum ada yang dikirim. SolTrail tidak mengirim transaksi sampai wallet menyetujui."
3. Klik **Send this message**. Status di panel berjalan: Preparing, Waiting for Wallet, Sending, Confirming, Success. Setujui di Phantom. Biaya yang terpakai adalah fee Devnet, bukan SOL mainnet.
4. Klik **Check this transaction**. Empat baris harus Pass:
   - Transaction found
   - Transaction succeeded
   - Signer matches this wallet
   - Memo program and note
5. Klik **View on Solana Explorer**. Tab terbuka di cluster Devnet.
6. Kembali, klik **Open the proof page**. Kalau pembacaan berhasil, kalimatnya: "Devnet confirms this SolTrail practice message." Halaman yang sama menolak signature yang bukan catatan latihan SolTrail.

Klik **Open The Receipt**.

### The Receipt

Masih transaksi yang sama. Tidak ada tanda tangan kedua.

1. **Read the fee**. Angka yang muncul adalah `meta.fee` dalam lamports.
2. **Read the time**. Kalau layar bilang `blockTime is null`, stage ini tetap terbuka. Tunggu sebentar, klik lagi.
3. **Name the program**. Alamat program Memo pada transaksi itu harus sama dengan program yang SolTrail pakai.

Klik **Open The Clock**.

### The Clock

1. **Read the current slot**.
2. **Compare the genesis hash**. Teks yang diharapkan: "It matches Devnet."
3. **Read the latest blockhash**.

Ucapkan: "Blockhash ini kedaluwarsa. Dia bukan transaksi."

Klik **Open Your Key**.

### Your Key

1. **Show the short form**. Bentuk pendek tampil di samping alamat penuh.
2. **Disconnect this wallet**. Layar menulis skor yang tersimpan dan meminta alamat yang sama disambungkan lagi.
3. Klik **Connect** untuk wallet yang sama. Bukan wallet lain. Teks yang diharapkan: "Saved score was still here" diikuti angka XP.
4. **Check Solana Devnet**.

Kalimat di halaman: "Every quest is cleared. 1600 XP is saved for this wallet in this browser."

Tutup dengan: "Skor itu tinggal di browser ini, untuk alamat ini. Transaksi yang tadi ditandatangani tetap bisa dibaca dari Devnet tanpa akun."

## Jalur singkat

Pakai ini kalau waktu yang tersisa sekitar satu setengah menit.

Sebelum dipanggil, selesaikan Wallet Basics dan Devnet SOL di browser dan wallet yang sama. Jangan hapus data situs. Naik dengan quest **First Message** sudah terbuka.

1. **Use this note**.
2. **Send this message**, setujui di Phantom.
3. **Check this transaction**, tunjuk empat Pass.
4. **Open the proof page**, lalu **View on Solana Explorer**.

Ucapkan: "Dua quest pertama sudah beres di browser ini. Yang berjalan sekarang adalah transaksi Memo dan pembacaan ulangnya dari Devnet."

Tunjuk skor di atas. Angka itu naik dari progres yang tersimpan, ditambah stage yang baru saja Cleared.

## Kalau macet

- Airdrop ditolak atau saldo tidak naik. Katakan bahwa faucet Devnet punya batas. Buka **Open the public faucet**, tunggu saldo melewati angka awal, lalu **Check that it arrived**.
- Popup Phantom ditutup tanpa menyetujui. Stage tidak menjadi Cleared. Klik **Send this message** lagi.
- Tombol kirim mati dan layar bilang saldo 0 SOL. Fee belum bisa dibayar. Selesaikan **See it arrive** dulu.
- Layar bilang "Switch Phantom to Devnet before sending." Wallet masih di mainnet. Nyalakan Testnet Mode dan pilih Solana Devnet, lalu kirim lagi.
- **Check this transaction** bilang Devnet belum mengembalikan signature. Tunggu, klik lagi.
- `blockTime is null` di The Receipt. Stage **Read the time** sengaja tetap terbuka. Klik lagi setelah beberapa detik.
- Setelah disconnect, yang tersambung adalah wallet lain. Layar bilang "This is a different wallet." Putuskan, sambungkan alamat yang tadi pergi.
- RPC tidak menjawab. Ulangi tombol yang sama. Stage yang sudah Cleared tidak hilang hanya karena satu permintaan gagal. Pengecualian: kalau signature tersimpan gagal dicek ulang saat halaman dimuat, stage dari **Send it** terbuka lagi. Kirim catatannya sekali lagi.
