import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { getPendaftaranForVerifikasi } from '../../api/pendaftaranApi';
import type { PendaftaranListResult } from '../../types/pendaftaran';

interface VerifikasiListItem {
  id: number;
  nama: string;
  nik: string;
  email: string;
  beasiswaNama: string;
  status: string;
  createdAt: string;
}

export default function VerifikasiList() {
  const [pendaftaranList, setPendaftaranList] = useState<VerifikasiListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 10,
    total: 0,
    totalPages: 0
  });

  const applyResult = (result: PendaftaranListResult) => {
    const formattedList = result.items.map(item => ({
      id: item.id,
      nama: item.dataDiri?.nama || '-',
      nik: item.dataDiri?.nik || '-',
      email: item.dataDiri?.email || '-',
      beasiswaNama: item.beasiswaNama || '-',
      status: item.status,
      createdAt: item.createdAt
    }));
    setPendaftaranList(formattedList);
    setPagination({
      page: result.page,
      perPage: result.perPage,
      total: result.total,
      totalPages: result.totalPages
    });
  };

  const fetchPendaftaran = async (page: number = 1, perPage: number = 10) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getPendaftaranForVerifikasi({
        page,
        perPage,
        status: 'under_review_admin'
      });
      applyResult(result);
    } catch (err) {
      setError('Gagal memuat daftar pendaftaran untuk verifikasi');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    getPendaftaranForVerifikasi({ page: 1, perPage: 10, status: 'under_review_admin' })
      .then((result) => {
        if (cancelled) return;
        applyResult(result);
      })
      .catch((err) => {
        if (cancelled) return;
        setError('Gagal memuat daftar pendaftaran untuk verifikasi');
        console.error(err);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchPendaftaran(newPage, pagination.perPage);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Daftar Pendaftaran untuk Verifikasi</h1>
          <p className="text-gray-600">Verifikasi dokumen pendaftar</p>
        </div>
      </div>

      <div className="space-y-4">
        {pendaftaranList.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Tidak Ada Data</CardTitle>
              <CardDescription>Belum ada pendaftaran yang perlu diverifikasi</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          pendaftaranList.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{item.nama}</span>
                  <Link to={`/verifikator/verifikasi/${item.id}`}>
                    <Button variant="outline">Lihat Detail</Button>
                  </Link>
                </CardTitle>
                <CardDescription>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div><span className="font-medium">NIK:</span> {item.nik}</div>
                    <div><span className="font-medium">Email:</span> {item.email}</div>
                    <div><span className="font-medium">Beasiswa:</span> {item.beasiswaNama}</div>
                    <div><span className="font-medium">Tanggal Daftar:</span> {item.createdAt}</div>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    item.status === 'under_review_admin' ? 'bg-yellow-100 text-yellow-800' :
                    item.status === 'lolos_admin' ? 'bg-green-100 text-green-800' :
                    item.status === 'ditolak_admin' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {item.status.replace('_', ' ')}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-4">
          <Button
            variant="outline"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            Sebelumnya
          </Button>

          <span className="mx-2">
            Halaman {pagination.page} dari {pagination.totalPages}
          </span>

          <Button
            variant="outline"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
          >
            Selanjutnya
          </Button>
        </div>
      )}
    </div>
  );
}