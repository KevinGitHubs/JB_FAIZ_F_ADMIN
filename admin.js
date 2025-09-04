const SUPABASE_URL = 'https://dgsyyzfcyyyahvapocjg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnc3l5emZjeXl5YWh2YXBvY2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MDUwNTQsImV4cCI6MjA3MjQ4MTA1NH0.5iUddYtSx7BTjkph0gea2xbeP-85X5Ee53X5laE1VCg';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const form = document.getElementById('addForm');
const list = document.getElementById('productList');
const pinGate = document.getElementById('pinGate');
const adminPanel = document.getElementById('adminPanel');

// PIN
window.checkPin = () => {
  if (document.getElementById('pinInput').value === 'JBF812') {
    pinGate.style.display = 'none';
    adminPanel.style.display = 'block';
    refresh();
  } else {
    alert('Password salah!');
  }
};

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
  const { data } = await supabaseClient.from('products').select('*').order('created_at', { ascending: false });
  list.innerHTML = (data || []).map(p => `
    <li>
      <img src="${p.thumb}">
      <span>${p.nama} (${p.cat}) – Stok ${p.stok} – Rp${p.harga.toLocaleString()}</span>
      <button onclick="del('${p.id}')">Hapus</button>
    </li>
  `).join('');
}

// Tambah produk
form.onsubmit = async e => {
  e.preventDefault();
  const fd = new FormData(form);
  const upload = async file => {
    const fname = Date.now() + '-' + file.name;
    const { data, error } = await supabaseClient.storage.from('public').upload(fname, file);
    return error ? null : supabaseClient.storage.from('public').getPublicUrl(fname).data.publicUrl;
  };

  const thumbUrl = await upload(fd.get('thumb'));
  const detailUrls = await Promise.all([...fd.getAll('detail')].map(upload));

  await supabaseClient.from('products').insert({
    cat: fd.get('cat'),
    nama: fd.get('nama'),
    stok: +fd.get('stok'),
    harga: +fd.get('harga'),
    thumb: thumbUrl,
    detail: detailUrls.filter(u => u)
  });
  form.reset(); refresh();
};

// Hapus produk
window.del = async id => {
  await supabaseClient.from('products').delete().eq('id', id);
  refresh();
};
