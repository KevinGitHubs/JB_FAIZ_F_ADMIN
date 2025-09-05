      </button>
    </div>
  `).join('');
}

// === UTILITAS ===
function getCategoryName(cat) {
  const names = { FF: 'Free Fire', ML: 'Mobile Legends', RB: 'Roblox', LAIN: 'Lainnya' };
  return names[cat] || cat;
}

// === LOAD AWAL ===
refresh();
// === CONFIG SUPABASE ===
const SUPABASE_URL = 'https://dgsyyzfcyyyahvapocjg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnc3l5emZjeXl5YWh2YXBvY2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MDUwNTQsImV4cCI6MjA3MjQ4MTA1NH0.5iUddYtSx7BTjkph0gea2xbeP-85X5Ee53X5laE1VCg';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// === NAMA BUCKET ===
const BUCKET_NAME = 'faizf-storage'; // Ganti dengan nama bucket kamu

// === ELEMEN DOM ===
const form = document.getElementById('addForm');
const list = document.getElementById('productList');

// === PREVIEW GAMBAR ===
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

// === FUNGSI UPLOAD FILE ===
const uploadFile = async (file) => {
  if (!file) return null;
  const ext = file.name.split('.').pop();
  const fname = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  
  const { data, error } = await supabaseClient.storage
    .from(BUCKET_NAME)
    .upload(fname, file, { cacheControl: '3600', upsert: false });

  if (error) {
    console.error('Upload error:', error);
    return null;
  }
  return supabaseClient.storage.from(BUCKET_NAME).getPublicUrl(fname).data.publicUrl;
};

// === SUBMIT PRODUK ===
form.onsubmit = async (e) => {
  e.preventDefault();
  const fd = new FormData(form);

  const thumbFile = fd.get('thumb');
  if (!thumbFile) {
    alert('⚠️ Foto thumbnail wajib diisi!');
    return;
  }

  const thumbUrl = await uploadFile(thumbFile);
  if (!thumbUrl) {
    alert('❌ Gagal upload thumbnail. Coba lagi!');
    return;
  }

  const detailUrls = await Promise.all(
    [...fd.getAll('detail')].filter(f => f).map(uploadFile)
  );

  const { error } = await supabaseClient.from('products').insert({
    cat: fd.get('cat'),
    nama: fd.get('nama').trim(),
    stok: Number(fd.get('stok')),
    harga: Number(fd.get('harga')),
    thumb: thumbUrl,
    detail: detailUrls.filter(u => u)
  });

  if (error) {
    alert('❌ Gagal menyimpan produk: ' + error.message);
  } else {
    alert('✅ Produk berhasil disimpan!');
    form.reset();
    document.getElementById('thumbPrev').style.display = 'none';
    document.getElementById('detailPrev').innerHTML = '';
    refresh();
  }
};

// === HAPUS PRODUK ===
window.del = async (id) => {
  const ok = confirm('Yakin ingin menghapus produk ini?');
  if (!ok) return;
  await supabaseClient.from('products').delete().eq('id', id);
  refresh();
};

// === TAMPILKAN PRODUK ===
async function refresh() {
  const { data } = await supabaseClient
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  list.innerHTML = (data || []).map(p => `
    <div class="product-card">
      <img src="${p.thumb}" alt="${p.nama}">
      <div class="product-info">
        <h3>${p.nama}</h3>
        <p class="cat">${getCategoryName(p.cat)}</p>
        <p class="stok">Stok: ${p.stok}</p>
        <p class="harga">Rp${p.harga.toLocaleString()}</p>
      </div>
      <button onclick="del('${p.id}')" class="delete-btn">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `).join('');
}

// === UTILITAS ===
function getCategoryName(cat) {
  const names = { FF: 'Free Fire', ML: 'Mobile Legends', RB: 'Roblox', LAIN: 'Lainnya' };
  return names[cat] || cat;
}

// === LOAD AWAL ===
refresh();
