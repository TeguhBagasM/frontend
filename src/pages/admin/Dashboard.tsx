import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { getDashboardStatistik, getHasilFinal } from "../../api/pendaftaranApi";
import * as XLSX from "xlsx";

// Define types for our chart data
interface StatistikChartData {
  name: string;
  value: number;
}

interface ExportData {
  id: number;
  nama: string;
  nik: string;
  email: string;
  noHp1: string;
  beasiswaNama: string;
  status: string;
  nilaiWawancara: number | null;
  catatanWawancara: string | null;
}

export default function Dashboard() {
  const [statistik, setStatistik] = useState<StatistikChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Colors for the pie chart
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82ca9d", "#ffc658"];

  // Export to Excel function
  const exportToExcel = async () => {
    try {
      const hasilFinal = await getHasilFinal();

      // Transform data for Excel export
      const exportData: ExportData[] = hasilFinal.map(item => ({
        id: item.id,
        nama: item.dataDiri?.nama || "-",
        nik: item.dataDiri?.nik || "-",
        email: item.dataDiri?.email || "-",
        noHp1: item.dataDiri?.noHp1 || "-",
        beasiswaNama: item.beasiswaNama || "-",
        status: item.status,
        nilaiWawancara: item.wawancaraTerbaru?.nilai || null,
        catatanWawancara: item.wawancaraTerbaru?.catatan || null,
      }));

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Hasil Final");

      // Export to file
      XLSX.writeFile(workbook, "hasil_final_pendaftar.xlsx");
    } catch (err) {
      console.error("Error exporting to Excel:", err);
      alert("Gagal mengekspor data ke Excel");
    }
  };

  // Fetch dashboard statistics
  useEffect(() => {
    const fetchDashboardStatistik = async () => {
      try {
        setLoading(true);
        const data = await getDashboardStatistik();

        // Convert to chart-friendly format
        const chartData: StatistikChartData[] = [
          { name: "Total Pendaftar", value: data.totalPendaftar },
          { name: "Lulus Admin", value: data.lulusAdmin },
          { name: "Tidak Lulus Admin", value: data.tidakLulusAdmin },
          { name: "Lulus Wawancara", value: data.lulusWawancara },
          { name: "Tidak Lulus Wawancara", value: data.tidakLulusWawancara },
          { name: "Dalam Proses Admin", value: data.dalamProsesAdmin },
          { name: "Dalam Proses Wawancara", value: data.dalamProsesWawancara },
        ];

        setStatistik(chartData);
        setError(null);
      } catch (err) {
        setError("Gagal memuat statistik dashboard");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStatistik();
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Admin</h1>
          <p className="text-gray-600">Statistik dan informasi pendaftaran</p>
        </div>
        <Button onClick={exportToExcel} variant="outline">
          Export Excel
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendaftar</CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="8.5" cy="7" r="4"/>
              <path d="M20 8v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8"/>
              <path d="M15 3v2m0 4v2m0 4v2"/>
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistik.find(s => s.name === "Total Pendaftar")?.value || 0}</div>
            <p className="text-xs text-muted-foreground">Jumlah total pendaftar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lulus Admin</CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-circle">
              <circle cx="12" cy="12" r="10"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistik.find(s => s.name === "Lulus Admin")?.value || 0}</div>
            <p className="text-xs text-muted-foreground">Pendaftar lolos verifikasi admin</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tidak Lulus Admin</CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x-circle">
              <circle cx="12" cy="12" r="10"/>
              <path d="m15 9-6 6"/>
              <path d="m9 9 6 6"/>
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistik.find(s => s.name === "Tidak Lulus Admin")?.value || 0}</div>
            <p className="text-xs text-muted-foreground">Pendaftar tidak lolos verifikasi admin</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lulus Wawancara</CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-award">
              <circle cx="12" cy="8" r="7"/>
              <polyline points="8.21 13.81 7 23 12 20 17 23 15.79 13.81"/>
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistik.find(s => s.name === "Lulus Wawancara")?.value || 0}</div>
            <p className="text-xs text-muted-foreground">Pendaftar lolos wawancara</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Statistik Pendaftaran</CardTitle>
            <CardDescription>Sebaran status pendaftar berdasarkan kategori</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={statistik}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="Jumlah" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Sebaran Status Pendaftar</CardTitle>
            <CardDescription>Distribusi status pendaftar dalam sistem</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statistik}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent = 0 }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {statistik.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
