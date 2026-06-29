import { useState, useEffect, useMemo } from "react";
import { Modal, Input, Button, message, Pagination, Select } from "antd";
import { PlusOutlined, DeleteOutlined, SearchOutlined } from "@ant-design/icons";
import { DataTable, type DataTableColumn } from "../../components/DataTable";
import { getProductosAdmin } from "../../api/products/productos";

interface ProductoFila {
  id_producto: number;
  codigo: string;
  nombre: string;
  marca: string;
  stock: number;
  precio: number; // precio original
  descuento: number; // porcentaje
  precioPromocion?: number; // precio final con descuento
  tipo_descuento?: "porcentaje" | "monto"; // tipo de descuento aplicado
  enPromocion?: boolean;
  promocionAsignada?: {
    id_promocion: number;
    titulo: string;
  } | null;
}

interface Props {
  open: boolean;
  onCancel: () => void;
  onSave: (productos: ProductoFila[]) => void;
  productosIniciales?: ProductoFila[];
}

export default function ModificarProductosModal({
  open,
  onCancel,
  onSave,
  productosIniciales,
}: Props) {
  const [productosDisponibles, setProductosDisponibles] = useState<ProductoFila[]>([]);
  const [productosSeleccionados, setProductosSeleccionados] = useState<ProductoFila[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0,
  });

  const [descuentoMasivo, setDescuentoMasivo] = useState("");
  const [filtroDescuento, setFiltroDescuento] = useState("todos");

  const productosInicialesSeguros = useMemo(
    () => productosIniciales ?? [],
    [productosIniciales]
  );

  const redondear2 = (valor: any) => {
    const num = typeof valor === 'string' ? parseFloat(valor) : valor;
    if (num === null || num === undefined || isNaN(num)) return 0;
    return Number(num.toFixed(2));
  };


  const calcularPrecioPromocion = (precio: number, descuento: number) => {
    return Math.round((precio - (precio * descuento) / 100) * 100) / 100;
  };

  const calcularDescuentoDesdePrecioPromocion = (precio: number, precioPromocion: number) => {
    if (precio <= 0) return 0;
    return Math.round(((precio - precioPromocion) / precio) * 100 * 100) / 100;
  };

  useEffect(() => {
    if (open) {
      setProductosSeleccionados(
        productosInicialesSeguros.map((p) => {
          const descuento = typeof p.descuento === "number" ? p.descuento : 0;
          const precioPromocion =
            typeof p.precioPromocion === "number"
              ? p.precioPromocion
              : calcularPrecioPromocion(p.precio, descuento);

          return {
            ...p,
            descuento,
            precioPromocion,
            tipo_descuento: p.tipo_descuento || "porcentaje",
          };
        })
      );
      setDescuentoMasivo("");
      setFiltroDescuento("todos");
    }
  }, [open, productosInicialesSeguros]);

  const fetchProductos = async (page = 1, searchText = "") => {
    setLoading(true);
    try {
      const response = await getProductosAdmin(page, pagination.pageSize, {
        search: searchText,
      });

      if (response.success) {
        setProductosDisponibles(response.data);
        setPagination((prev) => ({
          ...prev,
          current: response.pagination.currentPage,
          total: response.pagination.totalProductos,
        }));
      } else {
        message.error(response.message || "Error al cargar productos del inventario");
      }
    } catch (error: any) {
      message.error(
        error?.response?.data?.message ||
          error?.message ||
          "Error al cargar productos del inventario"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (open) {
        fetchProductos(1, search);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [search, open]);

  useEffect(() => {
    if (open) {
      fetchProductos(1, "");
      setSearch("");
    }
  }, [open]);

  const agregarProducto = (record: ProductoFila) => {
    if (record.enPromocion) {
      message.warning(
        `Este producto ya está asignado a la promoción "${record.promocionAsignada?.titulo || "existente"}"`,
      );
      return;
    }

    setProductosSeleccionados((prev) => {
      const existe = prev.find((p) => p.id_producto === record.id_producto);

      if (existe) {
        message.warning("Este producto ya está en la lista");
        return prev;
      }

      return [
        ...prev,
        {
          ...record,
          descuento: 0,
          precioPromocion: redondear2(record.precio),
        },
      ];
    });
  };

  const eliminarProducto = (id: number) => {
    setProductosSeleccionados((prev) =>
      prev.filter((p) => p.id_producto !== id)
    );
  };

  const actualizarDescuento = (id: number, valor: string) => {
    if (valor === "") {
      setProductosSeleccionados((prev) =>
        prev.map((p) =>
          p.id_producto === id
            ? {
                ...p,
                descuento: 0,
                precioPromocion: Math.round(p.precio * 100) / 100,
                tipo_descuento: "porcentaje",
              }
            : p
        )
      );
      return;
    }

    const nuevoValor = parseFloat(valor);

    if (isNaN(nuevoValor) || nuevoValor < 0 || nuevoValor > 100) {
      return;
    }

    setProductosSeleccionados((prev) =>
      prev.map((p) =>
        p.id_producto === id
          ? {
              ...p,
              descuento: nuevoValor,
              precioPromocion: calcularPrecioPromocion(p.precio, nuevoValor),
              tipo_descuento: "porcentaje",
            }
          : p
      )
    );
  };

  const actualizarPrecioPromocion = (id: number, valor: string) => {
    if (valor === "") {
      setProductosSeleccionados((prev) =>
        prev.map((p) =>
          p.id_producto === id
            ? {
                ...p,
                descuento: 0,
                precioPromocion: redondear2(p.precio),
                tipo_descuento: "porcentaje",
              }
            : p
        )
      );
      return;
    }

    const nuevoPrecioPromocion = parseFloat(valor);

    if (isNaN(nuevoPrecioPromocion) || nuevoPrecioPromocion < 0) {
      return;
    }

    setProductosSeleccionados((prev) =>
      prev.map((p) => {
        if (p.id_producto !== id) return p;

        const precioFinalValido =
          nuevoPrecioPromocion > p.precio ? p.precio : nuevoPrecioPromocion;

        const nuevoDescuento = calcularDescuentoDesdePrecioPromocion(
          p.precio,
          precioFinalValido
        );

        return {
          ...p,
          precioPromocion: Math.round(precioFinalValido * 100) / 100,
          descuento: nuevoDescuento < 0 ? 0 : nuevoDescuento,
          tipo_descuento: "monto",
        };
      })
    );
  };

  const marcasSeleccionadas = useMemo(() => {
    const marcas = productosSeleccionados
      .map((p) => p.marca)
      .filter((marca) => !!marca && marca.trim() !== "");

    return [...new Set(marcas)];
  }, [productosSeleccionados]);

  const aplicarDescuentoMasivo = () => {
    const valor = parseFloat(descuentoMasivo);

    if (isNaN(valor)) {
      message.warning("Ingresa un descuento válido");
      return;
    }

    if (valor < 0 || valor > 100) {
      message.warning("El descuento debe estar entre 0 y 100");
      return;
    }

    if (productosSeleccionados.length === 0) {
      message.warning("Primero agrega productos");
      return;
    }

    setProductosSeleccionados((prev) =>
      prev.map((p) =>
        filtroDescuento === "todos" || p.marca === filtroDescuento
          ? {
              ...p,
              descuento: valor,
              precioPromocion: calcularPrecioPromocion(p.precio, valor),
              tipo_descuento: "porcentaje",
            }
          : p
      )
    );

    if (filtroDescuento === "todos") {
      message.success(`Se aplicó ${valor}% a todos los productos`);
    } else {
      message.success(`Se aplicó ${valor}% a la marca ${filtroDescuento}`);
    }
  };

  const columnsDisponibles: DataTableColumn<any>[] = [
    { title: "Código", dataIndex: "id_producto", key: "id" },
    { title: "Producto", dataIndex: "nombre", key: "nombre" },
    { title: "Marca", dataIndex: "marca", key: "marca" },
    {
      title: "Precio",
      dataIndex: "precio",
      key: "precio",
      render: (v: any) =>
        `L. ${Number(v).toLocaleString("es-HN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
    },
    {
      title: "Acción",
      key: "action",
      render: (_: any, record: ProductoFila) => {
        const bloqueado = Boolean(record.enPromocion);

        return (
          <Button
            type="primary"
            size="small"
            icon={!bloqueado ? <PlusOutlined /> : undefined}
            disabled={bloqueado}
            title={
              bloqueado
                ? `Ya pertenece a ${record.promocionAsignada?.titulo || "otra promoción"}`
                : "Agregar"
            }
            className={
              bloqueado
                ? "bg-gray-200 border-gray-200 text-gray-500"
                : "bg-[#0081B4] border-[#0081B4] hover:!bg-[#006f99] hover:!border-[#006f99]"
            }
            onClick={() => agregarProducto(record)}
          >
            {bloqueado ? "En promoción" : "Agregar"}
          </Button>
        );
      },
    },
  ];

  const columnsAgregados: DataTableColumn<any>[] = [
    { title: "Código", dataIndex: "id_producto", key: "id" },
    { title: "Producto", dataIndex: "nombre", key: "nombre" },
    {
      title: "Precio original",
      dataIndex: "precio",
      key: "precio",
      render: (v: any) =>
        `L. ${Number(v).toLocaleString("es-HN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
    },
    {
      title: "Precio promoción (L.)",
      key: "precioPromocion",
      render: (_: any, record: ProductoFila) => (
        <Input
          type="number"
          min={0}
          max={record.precio}
          step={0.01}
          value={record.precioPromocion}
          onChange={(e) =>
            actualizarPrecioPromocion(record.id_producto, e.target.value)
          }
          className="w-28 bg-white text-black text-center border-gray-300 h-8 rounded hover:border-[#0081B4] focus:border-[#0081B4]"
        />
      ),
    },
    {
      title: "Descuento (%)",
      key: "dscto",
      render: (_: any, record: ProductoFila) => (
        <Input
          type="number"
          min={0}
          max={100}
          step={0.01}
          value={record.descuento}
          onChange={(e) => actualizarDescuento(record.id_producto, e.target.value)}
          className="w-24 bg-white text-black text-center border-gray-300 h-8 rounded hover:border-[#0081B4] focus:border-[#0081B4]"
        />
      ),
    },
    {
      title: "Acción",
      key: "action",
      render: (_: any, record: ProductoFila) => (
        <DeleteOutlined
          className="text-red-500 cursor-pointer text-lg"
          onClick={() => eliminarProducto(record.id_producto)}
        />
      ),
    },
  ];

  return (
    <Modal
      title={<span className="text-xl font-bold text-gray-700">Modificar Productos</span>}
      open={open}
      onCancel={onCancel}
      width="95%"
      style={{ maxWidth: "1100px" }}
      centered
      footer={
        <div className="flex flex-row justify-end gap-3 pt-1">
          <Button
            type="primary"
            onClick={() => onSave(productosSeleccionados)}
            className="w-full h-11 rounded-xl bg-[#0081B4] border-[#0081B4] font-medium hover:!bg-[#006f99] hover:!border-[#006f99]"
          >
            Guardar Cambios
          </Button>
          <Button
            onClick={onCancel}
            className="w-full h-11 rounded-xl border-gray-300 font-medium"
          >
            Cancelar
          </Button>
        </div>
      }
    >
      <div className="py-4 space-y-6">
        <div className="flex gap-2">
          <Input
            placeholder="Buscar por nombre o marca..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            prefix={<SearchOutlined className="text-gray-400" />}
            className="bg-[#f0f2f5] h-11 flex-1"
          />
        </div>

        <section className="hidden lg:block">
          <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">
            Inventario General
          </h4>
          <DataTable
            rowKey="id_producto"
            columns={columnsDisponibles}
            dataSource={productosDisponibles}
            loading={loading}
            pagination={{
              ...pagination,
              onChange: (p) => fetchProductos(p, search),
            }}
          />
        </section>

        <section className="lg:hidden">
          <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">
            Inventario General
          </h4>
          <div className="flex flex-col gap-3">
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0081B4]"></div>
                <p className="mt-2 text-sm text-gray-500">Cargando productos...</p>
              </div>
            ) : productosDisponibles.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No se encontraron productos
              </div>
            ) : (
              <>
                {productosDisponibles.map((producto) => (
                  <div
                    key={producto.id_producto}
                    className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-800">
                          {producto.nombre}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Código: {producto.id_producto} | {producto.marca}
                        </div>
                        {producto.enPromocion && (
                          <div className="mt-2 inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                            En promoción: {producto.promocionAsignada?.titulo || "Promoción existente"}
                          </div>
                        )}
                        <div className="text-sm font-bold text-[#0B4E87] mt-2">
                          L.{" "}
                          {Number(producto.precio).toLocaleString("es-HN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      </div>
                      <div className="w-full sm:w-auto mt-3 sm:mt-0">
                        <Button
                          type="primary"
                          size="middle"
                          icon={!producto.enPromocion ? <PlusOutlined /> : undefined}
                          disabled={producto.enPromocion}
                          className={
                            producto.enPromocion
                              ? "w-full sm:w-auto h-10 font-semibold"
                              : "bg-[#0081B4] border-[#0081B4] w-full sm:w-auto h-10 font-semibold hover:!bg-[#006f99] hover:!border-[#006f99]"
                          }
                          onClick={() => agregarProducto(producto)}
                        >
                          {producto.enPromocion ? "En promoción" : "Agregar"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {pagination.total > pagination.pageSize && (
                  <div className="flex justify-center mt-4 pt-2">
                    <Pagination
                      current={pagination.current}
                      pageSize={pagination.pageSize}
                      total={pagination.total}
                      onChange={(page) => fetchProductos(page, search)}
                      showSizeChanger={false}
                      showQuickJumper={false}
                      simple
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <section className="hidden lg:block">
          <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">
            Seleccionados para esta Promoción
          </h4>

          <div className="mb-4 p-4 bg-[#f7f9fb] border border-gray-200 rounded-xl">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[220px]">
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Aplicar a
                </label>
                <Select
                  value={filtroDescuento}
                  onChange={setFiltroDescuento}
                  className="w-full"
                  options={[
                    { value: "todos", label: "Todos los productos" },
                    ...marcasSeleccionadas.map((marca) => ({
                      value: marca,
                      label: `Marca: ${marca}`,
                    })),
                  ]}
                />
              </div>

              <div className="min-w-[140px]">
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Descuento (%)
                </label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={descuentoMasivo}
                  onChange={(e) => setDescuentoMasivo(e.target.value)}
                  placeholder="Ej. 15"
                  className="h-10"
                />
              </div>

              <Button
                type="primary"
                onClick={aplicarDescuentoMasivo}
                className="h-10 bg-[#0081B4] border-[#0081B4] font-medium hover:!bg-[#006f99] hover:!border-[#006f99]"
              >
                Aplicar descuento
              </Button>
            </div>
          </div>

          <DataTable
            rowKey="id_producto"
            columns={columnsAgregados}
            dataSource={productosSeleccionados}
            emptyMessage="No has seleccionado productos aún"
          />
        </section>

        <section className="lg:hidden">
          <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">
            Seleccionados para esta Promoción
          </h4>

          <div className="mb-4 p-4 bg-[#f7f9fb] border border-gray-200 rounded-xl space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Aplicar a
              </label>
              <Select
                value={filtroDescuento}
                onChange={setFiltroDescuento}
                className="w-full"
                options={[
                  { value: "todos", label: "Todos los productos" },
                  ...marcasSeleccionadas.map((marca) => ({
                    value: marca,
                    label: `Marca: ${marca}`,
                  })),
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Descuento (%)
              </label>
              <Input
                type="number"
                min={1}
                max={100}
                value={descuentoMasivo}
                onChange={(e) => setDescuentoMasivo(e.target.value)}
                placeholder="Ej. 15"
                className="h-10"
              />
            </div>

            <Button
              type="primary"
              onClick={aplicarDescuentoMasivo}
              className="w-full h-10 bg-[#0081B4] border-[#0081B4] font-medium hover:!bg-[#006f99] hover:!border-[#006f99]"
            >
              Aplicar descuento
            </Button>
          </div>

          <div className="flex flex-col gap-3">
            {productosSeleccionados.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No has seleccionado productos aún
              </div>
            ) : (
              productosSeleccionados.map((producto) => (
                <div
                  key={producto.id_producto}
                  className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-800">
                        {producto.nombre}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Código: {producto.id_producto} | Marca: {producto.marca}
                      </div>
                      <div className="text-sm font-bold text-[#0B4E87] mt-2">
                        Precio original: L.{" "}
                        {Number(producto.precio).toLocaleString("es-HN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </div>

                    <Button
                      type="primary"
                      danger
                      size="middle"
                      icon={<DeleteOutlined />}
                      className="h-10 px-4 font-semibold"
                      onClick={() => eliminarProducto(producto.id_producto)}
                    >
                      Eliminar
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <label className="text-xs text-gray-600 min-w-[110px]">
                        Precio promoción:
                      </label>
                      <Input
                        type="number"
                        min={0}
                        max={producto.precio}
                        step={0.01}
                        value={producto.precioPromocion}
                        onChange={(e) =>
                          actualizarPrecioPromocion(producto.id_producto, e.target.value)
                        }
                        className="flex-1 bg-[#f8f9fa] border-gray-300 text-center h-8 rounded"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="text-xs text-gray-600 min-w-[110px]">
                        Descuento (%):
                      </label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step={0.01}
                        value={producto.descuento}
                        onChange={(e) =>
                          actualizarDescuento(producto.id_producto, e.target.value)
                        }
                        className="flex-1 bg-[#f8f9fa] border-gray-300 text-center h-8 rounded"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </Modal>
  );
}