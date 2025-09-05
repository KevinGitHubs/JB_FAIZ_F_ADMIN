import { db, storage, collection, addDoc, onSnapshot, deleteDoc, doc, serverTimestamp, ref, uploadBytes, getDownloadURL } from './firebase-config.js';

const form = document.getElementById('addForm');
const list = document.getElementById('productList');

// Preview gambar
form.thumb.onchange = e => {
  const img = document.getElementById('thumbPrev');
  img.src = URL.createObjectURL(e.target.files[0]);
  img.style.display = 'block';
};
form.detail.onchange = e => {
  const box = document.getElementById('detailPrev');
  box.innerHTML = '';
  [...e.target.files].forEach(f => {
    const img = document.createElement('img');
    img.src = URL.createObjectURL(f);
    box.appendChild(img);
  });
};

// Upload file
const uploadFile = async (file) => {
  if (!file) return null;
  const storeRef = ref(storage, `products/${Date.now()}-${file.name}`);
  await uploadBytes(storeRef, file);
  return await getDownloadURL(storeRef);
};

// Simpan produk + deskripsi
form.onsubmit = async (e) => {
  e.preventDefault();
  const fd = new FormData(form);
  const thumbFile = fd.get('thumb');
  if (!thumbFile) return alert('⚠️ Thumbnail wajib!');

  const thumbUrl = await uploadFile(thumbFile);
  const detailUrls = await Promise.all([...fd.getAll('detail')].filter(f => f).map(uploadFile));

  await addDoc(collection(db, 'products'), {
    cat: fd.get('cat'),
    nama: fd.get('nama').trim(),
    stok: Number(fd.get('stok')),
    harga: Number(fd.get('harga')),
    deskripsi: fd.get('deskripsi').trim(),
    thumb: thumbUrl,
    detail: detailUrls.filter(u => u),
    createdAt: serverTimestamp()
  });

  alert('✅ Produk berhasil disimpan!');
  form.reset();
  document.getElementById('thumbPrev').style.display = 'none';
  document.getElementById('detailPrev').innerHTML = '';
};

// Hapus produk
window.del = async (id) => {
  if (!confirm('Yakin hapus?')) return;
  await deleteDoc(doc(db, 'products', id));
};

// Realtime list
onSnapshot(collection(db, 'products'), snap => {
  list.innerHTML = snap.docs.map(d => {
    const p = d.data();
    return `
      <div class="product-card">
        <img src="${p.thumb}" alt="${p.nama}">
        <div class="product-info">
          <h3>${p.nama}</h3>
          <p class="cat">${getCategoryName(p.cat)}</p>
          <p class="stok">Stok: <strong>${p.stok}</strong></p>
          <p class="harga">Rp${p.harga.toLocaleString()}</p>
          ${p.deskripsi ? `<p class="desc">${p.deskripsi}</p>` : ''}
        </div>
        <button onclick="del('${d.id}')" class="delete-btn"><i class="fas fa-trash"></i></button>
      </div>
    `;
  }).join('');
});

function getCategoryName(cat) {
  const names = { FF: 'Free Fire', ML: 'Mobile Legends', RB: 'Roblox', LAIN: 'Lainnya' };
  return names[cat] || cat;
}
