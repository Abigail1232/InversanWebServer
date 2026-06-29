import { useEffect, useState } from "react";
import { Button, Card, ConfigProvider, Grid, Pagination, Switch, message } from "antd";
import { Pencil, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { DataTable, type DataTableColumn } from "../../components/DataTable";
import ModifyModel from "../../components/modal/modifyModel";
import DeactivateModal from "../../components/modal/DeactivateModal";
import { FilterBar } from "../../components/FilterBar";
import {
  getModels,
  type Model,
  type GetModelsFilters,
  saveModel,
  toggleModelStatus,
  getCarBrands
} from "../../api/admin/models";

const { useBreakpoint } = Grid;

export default function ProductModelsPage() {

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [models, setModels] = useState<Model[]>([]);
  const [allBrands, setAllBrands] = useState<string[]>([]);

  const [filterName, setFilterName] = useState("");
  const [filterState, setFilterState] = useState<boolean | undefined>();
  const [filterModel, setFilterModel] = useState<string | undefined>();

  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [loadingDeactivate, setLoadingDeactivate] = useState(false);
  const [, setLoadingEdit] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalItems, setTotalItems] = useState(0);

  const columns: DataTableColumn<Model>[] = [
    { title: "ID", dataIndex: "id", key: "id" },

    { title: "MARCA DE VEHÍCULO", dataIndex: "brand", key: "brand"},

    { title: "MODELO DE VEHÍCULO", dataIndex: "name", key: "name" },

    {
      title: "AÑO",
      dataIndex: "year",
      key: "year",
      render: (value: unknown) => {
        if (!value) return "-";
        const d = new Date(value as Date | string);
        return d.getUTCFullYear();
      }
    },

    {
      title: "ESTADO",
      dataIndex: "active",
      key: "active",
      render: (_, record) => (
        <div className="flex items-center justify-center">
          <Switch
            checked={Boolean(record.active)}
            onChange={(checked) => handleToggleActive(record, checked)}
            style={{ backgroundColor: record.active ? "#16A34A" : "#D1D5DB" }}
          />
        </div>
      )
    },

    { title: "PRODUCTOS", dataIndex: "count", key: "productos" },
    {
      title: "ACCIONES",
      key: "acciones",
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            type="text"
            icon={<Pencil size={18} className="!text-blue-700" />}
            onClick={() => {
              setSelectedModel(record);
              setOpenEdit(true);
            }}
          />
        </div>
      )
    }
  ];

  const resetFilters = () => {
    setFilterName("");
    setFilterState(undefined);
    setFilterModel(undefined);
    setCurrentPage(1);
  };

  const handleSave = async (values: Model) => {

    setLoadingEdit(true);

    try {
      const year = typeof values.year === "string"
        ? parseInt(values.year, 10)
        : values.year;

      const response = await saveModel({
        id: selectedModel?.id,
        brand: values.brand,
        name: values.name,
        year: Number(year),
        versions: (values.versions as any) || [],
      });

      if (!response) return;

      setSelectedModel(null);
      setOpenEdit(false);

      await fetchModels();
      await fetchallBrands();

    } finally {
      setLoadingEdit(false);
    }
  };

  const handleDeactivate = async () => {

    setLoadingDeactivate(true);

    try {

      const res = await toggleModelStatus(
        selectedModel?.id as number,
        !selectedModel?.active
      );

      if (!res) return;

      setSelectedModel(null);
      setOpenDelete(false);

      await fetchModels();
      await fetchallBrands();

    } finally {
      setLoadingDeactivate(false);
    }
  };

  const handleToggleActive = async (model: Model, checked: boolean) => {
    if (!checked) {
      setSelectedModel(model);
      setOpenDelete(true);
    } else {
      try {
        const res = await toggleModelStatus(model.id, true);
        if (!res) return;
        message.success(`El modelo "${model.name}" fue activado correctamente.`);
        await fetchModels();
        await fetchallBrands();
      } catch (error) {
        console.error("Error al activar modelo:", error);
        message.error("No se pudo activar el modelo. Inténtalo de nuevo.");
      }
    }
  };

  const fetchallBrands = async () => {
    try {
      const response = await getCarBrands();
      setAllBrands(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchModels = async (page = 1, size = pageSize) => {

    const params: GetModelsFilters = {
      active: filterState,
      name: filterName || undefined,
      brand: filterModel || undefined,
      page,
      pageSize: size
    };

    try {

      const response = await getModels(params);

      setModels(response.data);
      setTotalItems(response.pagination.total);
      setCurrentPage(response.pagination.currentPage);
      setPageSize(response.pagination.pageSize);

    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchModels();
  }, [filterName, filterState, filterModel]);

  useEffect(() => {
    fetchallBrands();
  }, []);

  return (
  <ConfigProvider>
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 font-sans">

      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col gap-2 mb-4">
          <h1 className="text-2xl md:text-[32px] font-semibold text-[#1A1A1A] leading-8 md:leading-10">
            Administración de Modelos de Vehículos
          </h1>

          <p className="text-gray-400 text-sm md:text-lg">
            Gestión de modelos de vehículos y sus productos asociados.
          </p>
        </div>

        {/* FILTER BAR */}
        <div className="mb-4 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <FilterBar
            className=""
            search={{
              value: filterName,
              onChange: setFilterName,
              placeholder: "Buscar modelo de vehículo..."
            }}
            filters={[
              {
                placeholder: "Filtrar por Estado",
                value: filterState,
                onChange: (v) => setFilterState(v as boolean | undefined),
                options: [
                  { label: "Activo", value: true },
                  { label: "Inactivo", value: false },
                ]
              },
              {
                placeholder: "Filtrar por Marca",
                value: filterModel,
                onChange: (v) => setFilterModel(v as string | undefined),
                options: allBrands.map((model) => ({
                  label: model,
                  value: model
                }))
              },
            ]}
            onClear={resetFilters}
          >
            <Button
              icon={<Plus size={18} />}
              className="rounded-xl h-11 px-5 font-semibold shadow-sm !bg-[#027EB1] !text-white"
              onClick={() => {
                setSelectedModel(null);
                setOpenEdit(true);
              }}
            >
              Crear Modelo de Vehículo
            </Button>
          </FilterBar>
        </div>

        {/* TABLE / MOBILE */}

        {isMobile ? (

          <div className="flex flex-col gap-5">

            {models.map((model) => (

              <motion.div
                key={model.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >

                <Card
                  className="rounded-3xl shadow-md border-none overflow-hidden"
                  bodyStyle={{ padding: "20px" }}
                >

                  <div className="flex justify-between items-start mb-4">

                    <div className="flex flex-col gap-1">

                      <span className="px-3 py-1 bg-blue-50 text-[#027EB1] text-[10px] font-bold uppercase rounded-full w-fit tracking-wider">
                        Modelo #{model.id}
                      </span>

                      <h3 className="text-[#001d3d] text-lg font-bold">
                        {model.name}
                      </h3>

                    </div>

                  </div>

                  <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-2xl mb-4">

                    <div className="flex flex-col">

                      <span className="text-gray-400 text-[10px] uppercase font-bold">
                        Año
                      </span>

                      <span className="text-[#001d3d] font-extrabold text-base">
                        {new Date(model.year).getUTCFullYear()}
                      </span>

                    </div>

                    <div className="flex flex-col">

                      <span className="text-gray-400 text-[10px] uppercase font-bold">
                        Productos
                      </span>

                      <span className="text-[#001d3d] font-extrabold text-base">
                        {model.count}
                      </span>

                    </div>

                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <Switch
                      checked={Boolean(model.active)}
                      onChange={(checked) => handleToggleActive(model, checked)}
                      style={{ backgroundColor: model.active ? "#16A34A" : "#D1D5DB", transform: "scale(0.8)" }}
                    />
                    <span className="text-sm text-gray-600">
                      {model.active ? "Activo" : "Inactivo"}
                    </span>
                  </div>

                  <div className="flex justify-end gap-2">

                    <Button
                      icon={<Pencil size={16} />}
                      onClick={() => {
                        setOpenEdit(true);
                        setSelectedModel(model);
                      }}
                    />

                  </div>

                </Card>

              </motion.div>

            ))}

            <div className="flex justify-center mt-4">

              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={totalItems}
                showSizeChanger
                pageSizeOptions={["5", "10", "20"]}
                onChange={(page, size) => fetchModels(page, size)}
              />

            </div>

          </div>

        ) : (

          <DataTable
            rowKey="id"
            columns={columns}
            dataSource={models}
            showSummary
            pagination={{
              current: currentPage,
              pageSize,
              total: totalItems,
              onChange: (page, size) => fetchModels(page, size)
            }}
          />

        )}

      </div>

      <ModifyModel
        open={openEdit}
        onCancel={() => setOpenEdit(false)}
        onSave={handleSave}
        modeloEditar={selectedModel}
      />

      <DeactivateModal
        open={openDelete}
        itemName={selectedModel?.name || ""}
        itemType="Modelo de Vehículo"
        isActive={Boolean(selectedModel?.active)}
        loading={loadingDeactivate}
        onCancel={() => setOpenDelete(false)}
        onConfirm={handleDeactivate}
      />

    </div>
  </ConfigProvider>
  );
}