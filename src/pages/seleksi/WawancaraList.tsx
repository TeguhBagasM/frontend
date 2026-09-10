import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { getPendaftaranForWawancara } from '../../api/pendaftaranApi';
import type { PendaftaranDetail } from '../../types/pendaftaran';

interface WawancaraListItem {
  id: number;
  nama: string;
  nik: string;
  email: string;
  beasiswaNama: string;
  status: string;
  createdAt: string;
}

export default function WawancaraList() {
  const [pendaftaranList, setPendaftaranList] = useState<WawancaraListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const applyResult = (result: PendaftaranDetail[]) => {
    const formattedList = result.map(item => ({
      id: item.id,
      nama: item.dataDiri?.nama || '-',
      nik: item.dataDiri?.nik || '-',
      email: item.dataDiri?.email || '-',
      beasiswaNama: item.beasiswaNama || '-',
      status: item.status,
      createdAt: item.createdAt
    }));
    setPendaftaranList(formattedList);
  };

  useEffect(() => {
    let cancelled = false;
    getPendaftaranForWawancara()
      .then((result) => {
        if (cancelled) return;
        applyResult(result);
      })
      .catch((err) => {
        if (cancelled) return;
        setError('Gagal memuat daftar pendaftaran untuk wawancara');
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
          <h1 className="text-3xl font-bold">Daftar Pendaftaran untuk Wawancara</h1>
          <p className="text-gray-600">Kelola wawancara pendaftar</p>
        </div>
      </div>

      <div className="space-y-4">
        {pendaftaranList.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Tidak Ada Data</CardTitle>
              <CardDescription>Belum ada pendaftaran yang perlu wawancara</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          pendaftaranList.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{item.nama}</span>
                  <Link to={`/seleksi/wawancara/${item.id}`}>
                    <Button variant="outline">Isi Nilai</Button>
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
                    item.status === 'under_review_wawancara' ? 'bg-yellow-100 text-yellow-800' :
                    item.status === 'lulus_wawancara' ? 'bg-green-100 text-green-800' :
                    item.status === 'tidak_lulus_wawancara' ? 'bg-red-100 text-red-800' :
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
    </div>
  );
}