import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Eye, Calendar, Download } from 'lucide-react';
import { getAllSuggestions, type Sugerencia } from '../../api/suggestions/suggestion';
import { FilterBar } from '../../components/FilterBar';
import dayjs, { Dayjs } from 'dayjs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function SugerenciasReportePage() {
  const [sugerencias, setSugerencias] = useState<Sugerencia[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTipo, setSelectedTipo] = useState<string>('');
  const [fechaInicio, setFechaInicio] = useState<Dayjs | null>(null);
  const [fechaFin, setFechaFin] = useState<Dayjs | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSugerencia, setSelectedSugerencia] = useState<Sugerencia | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchSugerencias();
  }, []);

  const fetchSugerencias = async () => {
    try {
      setIsLoading(true);
      const data = await getAllSuggestions();
      setSugerencias(data);
    } catch (error) {
      console.error('Error al obtener sugerencias:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar sugerencias
  const filteredSugerencias = useMemo(() => {
    return sugerencias.filter((sugerencia) => {
      // Búsqueda por texto (incluyendo nombre de usuario o Anonimo)
      const username = sugerencia.usuario?.usuario || `Usuario #${sugerencia.id_usuario}`;
      const displayUser = sugerencia.id_usuario === 1 ? 'Anonimo' : username;

      const matchesSearch = searchQuery === '' ||
        sugerencia.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sugerencia.descripcion.toLowerCase().includes(searchQuery.toLowerCase()) ||
        displayUser.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      const matchesTipo = selectedTipo === '' || sugerencia.tipo === selectedTipo;

      if (!matchesTipo) return false;

      const itemDate = dayjs(sugerencia.fecha).startOf('day');
      const filterStart = fechaInicio ? fechaInicio.startOf('day') : null;
      const filterEnd = fechaFin ? fechaFin.endOf('day') : null;

      const cumpleInicio = filterStart
        ? itemDate.isAfter(filterStart) || itemDate.isSame(filterStart)
        : true;

      const cumpleFin = filterEnd
        ? itemDate.isBefore(filterEnd) || itemDate.isSame(filterEnd)
        : true;

      return cumpleInicio && cumpleFin;
    });
  }, [sugerencias, searchQuery, selectedTipo, fechaInicio, fechaFin]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSugerencias.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSugerencias.length / itemsPerPage);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePageClick = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleTipoChange = (value: string | number | boolean | undefined) => {
    setSelectedTipo(value === undefined ? '' : String(value));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedTipo('');
    setFechaInicio(null);
    setFechaFin(null);
    setCurrentPage(1);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(2, 126, 177);
    doc.text('Reporte de Sugerencias', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(74, 74, 74);
    doc.text(`Fecha de generación: ${dayjs().format('DD/MM/YYYY')}`, 14, 30);
    doc.text(`Total de registros: ${filteredSugerencias.length}`, 14, 36);

    if (selectedTipo) {
      doc.text(`Filtrado por tipo: ${getTipoLabel(selectedTipo)}`, 14, 42);
    }
    if (fechaInicio) {
      doc.text(`Fecha inicio: ${fechaInicio.format('DD/MM/YYYY')}`, 14, 48);
    }
    if (fechaFin) {
      doc.text(`Fecha fin: ${fechaFin.format('DD/MM/YYYY')}`, 14, 54);
    }

    const tableData = filteredSugerencias.map((sugerencia) => [
      `#${sugerencia.id_sugerencia}`,
      sugerencia.titulo,
      getTipoLabel(sugerencia.tipo),
      sugerencia.id_usuario === 1 ? 'Anonimo' : (sugerencia.usuario?.usuario || `Usuario #${sugerencia.id_usuario}`),
      dayjs(sugerencia.fecha).format('DD/MM/YYYY'),
      sugerencia.descripcion,
    ]);

    autoTable(doc, {
      head: [['ID', 'Título', 'Tipo', 'Usuario', 'Fecha', 'Descripción']],
      body: tableData,
      startY: selectedTipo || fechaInicio || fechaFin ? 60 : 48,
      styles: {
        fontSize: 8,
        cellPadding: 3,
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: [0, 62, 123],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 35 },
        2: { cellWidth: 30 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 'auto' },
      },
      alternateRowStyles: {
        fillColor: [243, 244, 246],
      },
      margin: { top: 10 },
    });

    const fileName = `sugerencias_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const handleViewSugerencia = (sugerencia: Sugerencia) => {
    setSelectedSugerencia(sugerencia);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSugerencia(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getTipoBadgeColor = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'recomendacion':
        return 'bg-[#d1fae5] text-[#10b981] border border-[#10b981]';
      case 'queja':
        return 'bg-[#fee2e2] text-[#ef4444] border border-[#ef4444]';
      default:
        return 'bg-[#dbeafe] text-[#3b82f6] border border-[#3b82f6]';
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'recomendacion':
        return 'Recomendación';
      case 'queja':
        return 'Queja';
      default:
        return tipo.charAt(0).toUpperCase() + tipo.slice(1);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      {/* Contenido Principal */}
      <div className="max-w-[1488px] mx-auto px-3 md:px-6 py-6 md:py-8">
        {/* Título Principal */}
        <div className="mb-6 pb-4 border-b border-[#e5e7eb] md:border-b-0 md:pb-0">
          <h1 className="font-['Arimo',sans-serif] text-[28px] md:text-[32px] font-bold text-[#1a1a1a] mb-2 leading-[34px] md:leading-normal">
            Reporte de Sugerencias
          </h1>
          <p className="font-['Arimo',sans-serif] text-[16px] md:text-[15px] text-[#4a4a4a] leading-[24px] md:leading-normal">
            Revisa y gestiona todas las sugerencias recibidas
          </p>
        </div>

        {/* Barra de Filtros ADAPTATIVA - Estilo "Producto" */}
        <div className="bg-white rounded-xl shadow-sm px-4 md:px-6 py-5 mb-4">
          <div className="">
            <div className="w-full">
              <FilterBar
                search={{
                  value: searchQuery,
                  onChange: handleSearchChange,
                  placeholder: 'Buscar por título o descripción...',
                }}
                filters={[
                  {
                    placeholder: 'Filtrar por Tipo',
                    value: selectedTipo || undefined,
                    onChange: handleTipoChange,
                    options: [
                      { label: 'Recomendaciones', value: 'recomendacion' },
                      { label: 'Quejas', value: 'queja' },
                    ],
                  },
                ]}
                fechaInicio={{
                  placeholder: 'Fecha Inicio',
                  value: fechaInicio,
                  onChange: (date) => {
                    setFechaInicio(date);
                    setCurrentPage(1);
                  },
                }}
                fechaFin={{
                  placeholder: 'Fecha Fin',
                  value: fechaFin,
                  onChange: (date) => {
                    setFechaFin(date);
                    setCurrentPage(1);
                  },
                }}
                onClear={handleClearFilters}
              >
                {/* Botón Exportar PDF */}
                <button
                  type="button"
                  onClick={handleExportPDF}
                  disabled={filteredSugerencias.length === 0}
                  className="h-11 bg-[#027EB1] text-white rounded-lg flex items-center justify-center gap-2 hover:bg-[#026085] transition-colors font-semibold text-sm md:text-[15px] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm whitespace-nowrap px-6 flex-shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Exportar PDF</span>
                </button>
              </FilterBar>
            </div>
          </div>
        </div>

        {/* Estadísticas Móviles */}
        <div className="md:hidden grid grid-cols-3 gap-3 mb-6">
          <div
            onClick={() => handleTipoChange('')}
            className={`border rounded-[10px] shadow-sm p-3 text-center transition-all cursor-pointer hover:shadow-md active:scale-95 ${selectedTipo === '' ? 'bg-[#EAF7FD] border-[#027EB1]' : 'bg-white border-[#e5e7eb]'}`}
          >
            <p className="font-['Arimo',sans-serif] text-[10px] text-[#3b82f6] mb-1">Total</p>
            <p className="font-['Arimo',sans-serif] text-[24px] font-bold text-[#1a1a1a]">{sugerencias.length}</p>
          </div>
          <div
            onClick={() => handleTipoChange('recomendacion')}
            className={`border rounded-[10px] shadow-sm p-3 text-center transition-all cursor-pointer hover:shadow-md active:scale-95 ${selectedTipo === 'recomendacion' ? 'bg-[#d1fae5] border-[#10b981]' : 'bg-white border-[#e5e7eb]'}`}
          >
            <p className="font-['Arimo',sans-serif] text-[10px] text-[#10b981] mb-1">Rec.</p>
            <p className="font-['Arimo',sans-serif] text-[24px] font-bold text-[#1a1a1a]">{sugerencias.filter(s => s.tipo === 'recomendacion').length}</p>
          </div>
          <div
            onClick={() => handleTipoChange('queja')}
            className={`border rounded-[10px] shadow-sm p-3 text-center transition-all cursor-pointer hover:shadow-md active:scale-95 ${selectedTipo === 'queja' ? 'bg-[#fee2e2] border-[#ef4444]' : 'bg-white border-[#e5e7eb]'}`}
          >
            <p className="font-['Arimo',sans-serif] text-[10px] text-[#ef4444] mb-1">Quejas</p>
            <p className="font-['Arimo',sans-serif] text-[24px] font-bold text-[#1a1a1a]">{sugerencias.filter(s => s.tipo === 'queja').length}</p>
          </div>
        </div>

        {/* Contenedor principal - Desktop */}
        <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-[#e5e7eb] p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div
              onClick={() => handleTipoChange('')}
              className={`rounded-2xl border p-5 shadow-sm relative transition-all cursor-pointer hover:shadow-lg active:scale-[0.98] group ${selectedTipo === '' ? 'bg-[#EAF7FD] border-[#027EB1]' : 'bg-white border-[#e5e7eb]'}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <p className="font-['Arimo',sans-serif] text-[14px] text-[#027eb1] mb-2">Total de</p>
                  <p className="font-['Arimo',sans-serif] text-[14px] text-[#027eb1]">Sugerencias</p>
                </div>
                <div className={`rounded-full p-3 transition-colors ${selectedTipo === '' ? 'bg-[#027eb1] text-white' : 'bg-[#dbeafe] text-[#3b82f6]'}`}>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                    <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                  </svg>
                </div>
              </div>
              <p className="font-['Arimo',sans-serif] text-[40px] font-bold text-[#1a1a1a] mb-2 leading-none">{sugerencias.length}</p>
              <p className="font-['Arimo',sans-serif] text-[13px] text-[#3b82f6]">Registros totales</p>
            </div>

            <div
              onClick={() => handleTipoChange('recomendacion')}
              className={`rounded-2xl border p-5 shadow-sm relative transition-all cursor-pointer hover:shadow-lg active:scale-[0.98] group ${selectedTipo === 'recomendacion' ? 'bg-[#d1fae5] border-[#10b981]' : 'bg-white border-[#e5e7eb]'}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <p className="font-['Arimo',sans-serif] text-[14px] text-[#10b981] mb-2">Recomendaciones</p>
                  <p className="font-['Arimo',sans-serif] text-[14px] text-[#10b981]">recibidas</p>
                </div>
                <div className={`rounded-full p-3 transition-colors ${selectedTipo === 'recomendacion' ? 'bg-[#10b981] text-white' : 'bg-[#d1fae5] text-[#10b981]'}`}>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <p className="font-['Arimo',sans-serif] text-[40px] font-bold text-[#1a1a1a] mb-2 leading-none">{sugerencias.filter(s => s.tipo === 'recomendacion').length}</p>
              <p className="font-['Arimo',sans-serif] text-[13px] text-[#10b981]">Ideas de clientes</p>
            </div>

            <div
              onClick={() => handleTipoChange('queja')}
              className={`rounded-2xl border p-5 shadow-sm relative transition-all cursor-pointer hover:shadow-lg active:scale-[0.98] group ${selectedTipo === 'queja' ? 'bg-[#fee2e2] border-[#ef4444]' : 'bg-white border-[#e5e7eb]'}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <p className="font-['Arimo',sans-serif] text-[14px] text-[#ef4444] mb-2">Quejas</p>
                  <p className="font-['Arimo',sans-serif] text-[14px] text-[#ef4444]">reportadas</p>
                </div>
                <div className={`rounded-full p-3 transition-colors ${selectedTipo === 'queja' ? 'bg-[#ef4444] text-white' : 'bg-[#fee2e2] text-[#ef4444]'}`}>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <p className="font-['Arimo',sans-serif] text-[40px] font-bold text-[#1a1a1a] mb-2 leading-none">{sugerencias.filter(s => s.tipo === 'queja').length}</p>
              <p className="font-['Arimo',sans-serif] text-[13px] text-[#ef4444]">Requiere atención</p>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="font-['Arimo',sans-serif] text-[15px] text-[#4a4a4a]">Cargando sugerencias...</p>
            </div>
          ) : filteredSugerencias.length === 0 ? (
            <div className="text-center py-12">
              <p className="font-['Arimo',sans-serif] text-[15px] text-[#4a4a4a]">No se encontraron sugerencias</p>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-2xl border border-[#d1d5dc] bg-white shadow-sm">
                <div className="relative overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[#0B4E87]">
                        <th className="px-4 py-4 text-center text-sm uppercase tracking-wide text-white">ID</th>
                        <th className="px-4 py-4 text-center text-sm uppercase tracking-wide text-white">Título</th>
                        <th className="px-4 py-4 text-center text-sm uppercase tracking-wide text-white">Tipo</th>
                        <th className="px-4 py-4 text-center text-sm uppercase tracking-wide text-white">Usuario</th>
                        <th className="px-4 py-4 text-center text-sm uppercase tracking-wide text-white">Fecha</th>
                        <th className="px-4 py-4 text-center text-sm uppercase tracking-wide text-white">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((sugerencia) => (
                        <tr key={sugerencia.id_sugerencia} className="border-b border-[#e5e7eb] hover:bg-[#f9fafb]">
                          <td className="px-4 py-3 text-center text-sm text-[#1e2939]">
                            <div className="flex justify-center items-center">#{sugerencia.id_sugerencia}</div>
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-[#1e2939]">
                            <div className="flex justify-center items-center line-clamp-1">{sugerencia.titulo}</div>
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-[#1e2939]">
                            <div className="flex justify-center items-center">
                              <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-full font-['Arimo',sans-serif] text-[12px] font-semibold ${getTipoBadgeColor(sugerencia.tipo)}`}>
                                {getTipoLabel(sugerencia.tipo)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-[#1e2939]">
                            <div className="flex justify-center items-center">
                              <span className="font-['Arimo',sans-serif] text-[14px]">
                                {sugerencia.id_usuario === 1 ? (
                                  <span className="text-[#6b7280]">Anonimo</span>
                                ) : (
                                  sugerencia.usuario?.usuario || `Usuario #${sugerencia.id_usuario}`
                                )}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-[#1e2939]">
                            <div className="flex justify-center items-center gap-2">
                              <Calendar className="w-4 h-4 text-[#9ca3af]" />
                              <span className="font-['Arimo',sans-serif] text-[14px]">{formatDate(sugerencia.fecha)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-[#1e2939]">
                            <div className="flex justify-center items-center">
                              <button
                                className="p-1.5 hover:bg-[#e6f7ff] rounded-md transition-colors group"
                                onClick={() => handleViewSugerencia(sugerencia)}
                                title="Ver detalles"
                              >
                                <Eye className="w-5 h-5 text-[#027eb1] group-hover:text-[#003e7b]" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex h-[60px] items-center justify-between border-t border-[rgba(139,90,43,0.04)] bg-[rgba(139,90,43,0.03)] px-4">
                    <button
                      className="rounded-lg border border-[#d1d5dc] bg-white px-4 py-2 text-sm font-medium text-[#364153] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </button>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: totalPages }, (_, index) => (
                        <button
                          key={index + 1}
                          className={`h-10 w-10 rounded-lg text-sm font-medium transition-colors ${currentPage === index + 1
                            ? 'bg-[#0B4E86] text-white shadow-sm'
                            : 'border border-[#d1d5dc] bg-white text-[#364153] hover:bg-gray-50'
                            }`}
                          onClick={() => handlePageClick(index + 1)}
                        >
                          {index + 1}
                        </button>
                      ))}
                    </div>
                    <button
                      className="rounded-lg border border-[#d1d5dc] bg-white px-4 py-2 text-sm font-medium text-[#364153] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Vista Móvil - Tarjetas */}
        <div className="md:hidden space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="font-['Arimo',sans-serif] text-[15px] text-[#4a4a4a]">Cargando sugerencias...</p>
            </div>
          ) : filteredSugerencias.length === 0 ? (
            <div className="text-center py-12">
              <p className="font-['Arimo',sans-serif] text-[15px] text-[#4a4a4a]">No se encontraron sugerencias</p>
            </div>
          ) : (
            <>
              {currentItems.map((sugerencia) => (
                <div
                  key={sugerencia.id_sugerencia}
                  className="bg-white border border-[#e5e7eb] rounded-[10px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_0px_rgba(0,0,0,0.1)] p-4"
                >
                  <div className="flex items-start justify-between mb-3 pb-3 border-b border-[#e5e7eb]">
                    <div>
                      <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full font-['Arimo',sans-serif] text-[12px] font-semibold ${getTipoBadgeColor(sugerencia.tipo)}`}>
                        {getTipoLabel(sugerencia.tipo)}
                      </span>
                    </div>
                    <p className="font-['Arimo',sans-serif] text-[12px] text-[#4a4a4a]">ID: #{sugerencia.id_sugerencia}</p>
                  </div>

                  <p className="font-['Inter:Medium',sans-serif] font-medium text-[16px] text-[#1e2939] mb-3">
                    {sugerencia.id_usuario === 1 ? (
                      <span className="text-[#6b7280]">Anonimo</span>
                    ) : (
                      sugerencia.usuario?.usuario || `Usuario #${sugerencia.id_usuario}`
                    )}
                  </p>

                  <div className="mb-3 pb-3 border-b border-[#e5e7eb]">
                    <p className="font-['Arimo',sans-serif] text-[14px] text-[#4a4a4a] mb-1">Título</p>
                    <p className="font-['Arimo',sans-serif] text-[14px] text-[#1a1a1a] font-medium">{sugerencia.titulo}</p>
                  </div>

                  <div className="mb-3 pb-3 border-b border-[#e5e7eb]">
                    <p className="font-['Arimo',sans-serif] text-[14px] text-[#4a4a4a] mb-1">Descripción</p>
                    <p className="font-['Arimo',sans-serif] text-[14px] text-[#1a1a1a] line-clamp-2">{sugerencia.descripcion}</p>
                  </div>

                  <div className="mb-3 pb-3 border-b border-[#e5e7eb]">
                    <p className="font-['Arimo',sans-serif] text-[14px] text-[#4a4a4a] mb-1">Fecha</p>
                    <p className="font-['Arimo',sans-serif] text-[14px] text-[#1a1a1a]">{formatDate(sugerencia.fecha)}</p>
                  </div>

                  <div className="flex items-center justify-end">
                    <button
                      onClick={() => handleViewSugerencia(sugerencia)}
                      className="rounded-[10px] size-[36px] flex items-center justify-center hover:bg-[#f3f4f6] transition-colors"
                      title="Ver detalles"
                    >
                      <Eye className="w-5 h-5 text-[#4a5565]" />
                    </button>
                  </div>
                </div>
              ))}

              {totalPages > 1 && (
                <div className="flex justify-between items-center pt-4">
                  <button
                    className="px-4 py-2 font-['Arimo',sans-serif] text-[14px] text-[#4a4a4a] hover:text-[#1a1a1a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 border border-[#e5e7eb] rounded-lg hover:bg-[#f3f4f6]"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" /> Anterior
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="font-['Arimo',sans-serif] text-[14px] text-[#4a4a4a]">{currentPage} / {totalPages}</span>
                  </div>
                  <button
                    className="px-4 py-2 font-['Arimo',sans-serif] text-[14px] text-[#4a4a4a] hover:text-[#1a1a1a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 border border-[#e5e7eb] rounded-lg hover:bg-[#f3f4f6]"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal de Detalle */}
      {isModalOpen && selectedSugerencia && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-3 md:p-4">
          <div className="bg-white rounded-2xl shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] w-full max-w-[600px] overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="min-h-[70px] md:h-[84.8px] border-b border-[#e5e7eb] flex items-center justify-between px-4 md:px-8 py-4 md:py-0">
              <h2 className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[20px] md:text-[24px] text-[#1a1a1a]">Detalle de Sugerencia</h2>
              <button
                onClick={handleCloseModal}
                className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-[#6b7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 md:p-8">
              <div className="flex justify-center mb-4 md:mb-6">
                <div className={`rounded-full w-12 h-12 md:w-16 md:h-16 flex items-center justify-center ${selectedSugerencia.tipo === 'recomendacion'
                  ? 'bg-[#d1fae5]'
                  : selectedSugerencia.tipo === 'queja'
                    ? 'bg-[#fee2e2]'
                    : 'bg-[#dbeafe]'
                  }`}>
                  {selectedSugerencia.tipo === 'recomendacion' ? (
                    <svg className="w-6 h-6 md:w-8 md:h-8 text-[#10b981]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : selectedSugerencia.tipo === 'queja' ? (
                    <svg className="w-6 h-6 md:w-8 md:h-8 text-[#ef4444]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 md:w-8 md:h-8 text-[#3b82f6]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>

              <h3 className="font-['Inter:Bold',sans-serif] font-bold text-[18px] md:text-[24px] text-[#1a1a1a] text-center mb-2">{selectedSugerencia.titulo}</h3>

              <div className="flex items-center justify-center gap-4 mb-6">
                <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full font-['Inter:Medium',sans-serif] text-[12px] font-semibold ${getTipoBadgeColor(selectedSugerencia.tipo)}`}>
                  {getTipoLabel(selectedSugerencia.tipo)}
                </span>
                <span className="text-[#6b7280] text-[14px] font-['Inter:Regular',sans-serif]">ID: #{selectedSugerencia.id_sugerencia}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-[#f9fafb] rounded-lg p-4">
                  <p className="font-['Inter:Medium',sans-serif] text-[12px] text-[#9ca3af] uppercase tracking-wider mb-1">Usuario</p>
                  <p className="font-['Inter:Semi_Bold',sans-serif] text-[14px] text-[#1a1a1a]">
                    {selectedSugerencia.id_usuario === 1 ? (
                      <span className="text-[#6b7280]">Anonimo</span>
                    ) : (
                      selectedSugerencia.usuario?.usuario || `Usuario #${selectedSugerencia.id_usuario}`
                    )}
                  </p>
                </div>
                <div className="bg-[#f9fafb] rounded-lg p-4">
                  <p className="font-['Inter:Medium',sans-serif] text-[12px] text-[#9ca3af] uppercase tracking-wider mb-1">Fecha</p>
                  <p className="font-['Inter:Semi_Bold',sans-serif] text-[14px] text-[#1a1a1a]">{formatDate(selectedSugerencia.fecha)}</p>
                </div>
              </div>

              <div className="bg-white border border-[#e5e7eb] rounded-lg p-4">
                <p className="font-['Inter:Medium',sans-serif] text-[14px] text-[#1a1a1a] mb-2">Descripción</p>
                <p className="font-['Inter:Regular',sans-serif] text-[14px] text-[#6b7280] leading-relaxed whitespace-pre-wrap">{selectedSugerencia.descripcion}</p>
              </div>
            </div>

            <div className="bg-[#f9fafb] border-t border-[#e5e7eb] px-4 md:px-8 py-4 md:py-6 flex items-center justify-end gap-3">
              <button
                onClick={handleCloseModal}
                className="px-4 md:px-6 py-2.5 md:py-3 bg-white border-2 border-[#e5e7eb] text-[#4a4a4a] font-['Inter:Medium',sans-serif] font-medium text-[14px] md:text-[16px] rounded-[14px] hover:bg-gray-50 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
