// sw.js — Service Worker untuk notifikasi pengingat harian
// Letakkan file ini di root repo GitHub (sejajar dengan index.html)

const NOTIF_TAG = 'pkm-reminder';

// Tangkap event notificationclick → buka app
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type:'window', includeUncontrolled:true }).then(list => {
      if(list.length > 0) return list[0].focus();
      return clients.openWindow('/');
    })
  );
});

// Tangkap pesan dari halaman utama
self.addEventListener('message', e => {
  if(e.data?.type === 'SCHEDULE_NOTIF') {
    scheduleDaily(e.data.hour, e.data.minute);
  }
});

// Jadwalkan notifikasi harian
function scheduleDaily(hour, minute) {
  // Hitung berapa ms sampai jam target berikutnya
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);
  if(target <= now) target.setDate(target.getDate() + 1);
  const delay = target - now;

  setTimeout(() => {
    fireIfNeeded(hour, minute);
    // Ulangi setiap 24 jam
    setInterval(() => fireIfNeeded(hour, minute), 24 * 60 * 60 * 1000);
  }, delay);
}

function fireIfNeeded(hour, minute) {
  const now = new Date();
  const day = now.getDay(); // 0=Minggu, 1=Sen, ..., 6=Sab

  // Cek hari: kirim ke semua ruangan Senin-Sabtu (day 1-6)
  // Khusus Minggu (day 0) tetap kirim tapi hanya untuk UGD
  const isWeekday = day >= 1 && day <= 6;
  const isSunday  = day === 0;

  if(isWeekday) {
    self.registration.showNotification('🏥 Puskesmas Loa Duri', {
      body: 'Pengingat: isi checklist pemeliharaan lingkungan kerja hari ini.',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: NOTIF_TAG,
      renotify: true,
      data: { url: '/' }
    });
  } else if(isSunday) {
    self.registration.showNotification('🏥 Puskesmas Loa Duri — UGD', {
      body: 'Pengingat: isi checklist Ruang UGD hari ini (hari Minggu).',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: NOTIF_TAG+'-ugd',
      renotify: true,
      data: { url: '/?room=ugd' }
    });
  }
}
