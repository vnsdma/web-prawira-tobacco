export default function AdminWireframe() {
    return (
      <div className="flex h-screen bg-gray-100 p-4 font-sans text-black">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r p-4 shadow-sm flex flex-col gap-4">
          <div className="font-bold text-xl mb-6">Prawira Admin</div>
          <div className="bg-gray-200 p-2 rounded text-sm font-medium">📦 Stok & Inventori</div>
          <div className="p-2 text-sm text-gray-600">🛒 Pesanan (Orders)</div>
          <div className="p-2 text-sm text-gray-600">💳 Transaksi Midtrans</div>
        </div>
  
        {/* Main Content */}
        <div className="flex-1 p-6 flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Manajemen Stok</h1>
            <button className="bg-blue-600 text-white px-4 py-2 rounded">+ Tambah Produk</button>
          </div>
  
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded shadow-sm border-l-4 border-blue-500">Total SKU: 124</div>
            <div className="bg-white p-4 rounded shadow-sm border-l-4 border-red-500">Stok Menipis: 5</div>
            <div className="bg-white p-4 rounded shadow-sm border-l-4 border-green-500">Nilai Aset: Rp 15M</div>
          </div>
  
          {/* Table Mockup */}
          <div className="bg-white flex-1 rounded shadow-sm p-4">
            <div className="grid grid-cols-5 font-bold border-b pb-2 mb-2 text-sm">
              <div>Nama Produk</div>
              <div>Kategori</div>
              <div>Stok</div>
              <div>Harga</div>
              <div>Aksi</div>
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="grid grid-cols-5 border-b py-3 text-sm items-center">
                <div>Bako Prawira {i}</div>
                <div>Tembakau</div>
                <div className={i === 2 ? "text-red-500 font-bold" : ""}>{i === 2 ? "4" : "50"}</div>
                <div>Rp 25.000</div>
                <div className="text-blue-500">Edit | Hapus</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }