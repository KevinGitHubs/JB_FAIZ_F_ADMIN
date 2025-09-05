const SUPABASE_URL = 'https://dgsyyzfcyyyahvapocjg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnc3l5emZjeXl5YWh2YXBvY2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MDUwNTQsImV4cCI6MjA3MjQ4MTA1NH0.5iUddYtSx7BTjkph0gea2xbeP-85X5Ee53X5laE1VCg';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const form = document.getElementById('addForm');
const list = document.getElementById('productList');

// Preview foto
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

// Tampilkan produk
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

// Tambah produk
form.onsubmit = async e => {
  e.preventDefault();
  const fd = new FormData(form);

  const upload = async file => {
    const fname = Date.now() + '-' + file.name;
    const { data, error } = await supabaseClient.storage
      .from('public')
      .upload(fname, file);
    return error ? null : supabaseClient.storage.from('public').getPublicUrl(fname).data.publicUrl;
  };

  const thumbUrl = await upload(fd.get('thumb'));
  const detailUrls = await Promise.all([...fd.getAll('detail')].map(upload));

  const { error } = await supabaseClient.from('products').insert({
    cat: fd.get('cat'),
    nama: fd.get('nama'),
    stok: +fd.get('stok'),
    harga: +fd.get('harga'),
    thumb: thumbUrl,
    detail: detailUrls.filter(u => u)
  });

  if (error) {
    alert('Gagal menyimpan produk: ' + error.message);
  } else {
    form.reset();
    document.getElementById('thumbPrev').style.display = 'none';
    document.getElementById('detailPrev').innerHTML = '';
    refresh();
  }
};

// Hapus produk
window.del = async id => {
  const conf = confirm('Yakin ingin menghapus produk ini?');
  if (!conf) return;
  await supabaseClient.from('products').delete().eq('id', id);
  refresh();
};

function getCategoryName(cat) {
  const names = { FF: 'Free Fire', ML: 'Mobile Legends', RB: 'Roblox', LAIN: 'Lainnya' };
  return names[cat] || cat;
}

// Load awal
refresh();
