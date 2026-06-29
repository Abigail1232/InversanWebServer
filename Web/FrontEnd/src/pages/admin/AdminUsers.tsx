import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Input,
  Select,
  Tag,
  Modal,
  Form,
  Row,
  Col,
  message,
  ConfigProvider,
  Switch,
} from "antd";
import {
  PlusOutlined,
} from "@ant-design/icons";
import { Pencil, AlertTriangle, CheckCircle2 } from "lucide-react";
import api from "../../api/axios";
import { DataTable, type DataTableColumn } from "../../components/DataTable";
import { FilterBar } from "../../components/FilterBar";
import { fetchRoles, type Role } from "../../api/admin/roles";
import { getAllBranches, getEmployeesForBranch } from "../../api/branches/branches";

type UserStatus = "Activo" | "Inactivo";

type BackendRole = {
  id_rol: number;
  nombre: string;
  descripcion?: string;
};

type BackendUser = {
  id_usuario: number;
  usuario: string;
  correo: string;
  primer_nombre: string;
  segundo_nombre?: string | null;
  primer_apellido: string;
  segundo_apellido?: string | null;
  telefono?: string | null;
  activo: boolean;
  id_rol: number;
  rol?: BackendRole;
};

type BranchOption = {
  id_sucursal: number;
  nombre: string;
  id_usuario?: number | null;
};

export type AdminUser = {
  id: string;
  backendId: number;
  username: string;
  firstName: string;
  secondName?: string;
  lastName: string;
  secondLastName?: string;
  email: string;
  phone: string;
  roleId: number;
  roleName: string;
  status: UserStatus;
  branchId?: number;
};

type CreateUserFormValues = {
  username: string;
  roleId: number;
  branchId?: number;
  firstName: string;
  secondName?: string;
  lastName: string;
  secondLastName?: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

type EditUserFormValues = {
  username: string;
  roleId: number;
  branchId?: number;
  firstName: string;
  secondName?: string;
  lastName: string;
  secondLastName?: string;
  email: string;
  phone: string;
};

const STATUS_OPTIONS: UserStatus[] = ["Activo", "Inactivo"];

const normalizeHondurasPhone = (value: string = "") =>
  value.replace(/\D/g, "").slice(0, 8);

const hondurasPhoneRules = [
  { required: true, message: "Ingresa el teléfono" },
  {
    validator: (_: unknown, value?: string) => {
      const normalized = normalizeHondurasPhone(value || "");

      if (!normalized) {
        return Promise.resolve();
      }

      if (normalized.length !== 8) {
        return Promise.reject(new Error("El teléfono debe tener 8 dígitos"));
      }

      if (!/^[2389]\d{7}$/.test(normalized)) {
        return Promise.reject(
          new Error("El teléfono de Honduras debe iniciar con 2, 3, 8 o 9"),
        );
      }

      return Promise.resolve();
    },
  },
];

const getRoleName = (user: BackendUser): string => {
  const name = user.rol?.nombre?.trim();
  return name || `Rol ${user.id_rol}`;
};

const mapBackendUserToAdminUser = (u: BackendUser): AdminUser => ({
  id: String(u.id_usuario),
  backendId: u.id_usuario,
  username: u.usuario,
  firstName: u.primer_nombre,
  secondName: u.segundo_nombre || "",
  lastName: u.primer_apellido,
  secondLastName: u.segundo_apellido || "",
  email: u.correo,
  phone: normalizeHondurasPhone(u.telefono || ""),
  roleId: u.id_rol,
  roleName: getRoleName(u),
  status: u.activo ? "Activo" : "Inactivo",
  branchId: undefined,
});

const apiUsers = {
  listUsers: async (): Promise<AdminUser[]> => {
    const response = await api.get("/api/users");
    const rawUsers: BackendUser[] = Array.isArray(response.data)
      ? response.data
      : response.data?.users || [];

    return rawUsers.map(mapBackendUserToAdminUser);
  },

  createUser: async (payload: {
    username: string;
    roleId: number;
    firstName: string;
    secondName?: string;
    lastName: string;
    secondLastName?: string;
    email: string;
    phone: string;
    password: string;
  }) => {
    const response = await api.post("/api/users", {
      usuario: payload.username,
      correo: payload.email,
      clave: payload.password,
      primer_nombre: payload.firstName,
      segundo_nombre: payload.secondName || null,
      primer_apellido: payload.lastName,
      segundo_apellido: payload.secondLastName || null,
      telefono: payload.phone || null,
      id_rol: payload.roleId,
    });

    return response.data?.user
      ? mapBackendUserToAdminUser(response.data.user)
      : null;
  },

  updateUser: async (
    id: string,
    payload: {
      username: string;
      roleId: number;
      firstName: string;
      secondName?: string;
      lastName: string;
      secondLastName?: string;
      email: string;
      phone: string;
    },
  ) => {
    const response = await api.patch(`/api/users/${id}`, {
      usuario: payload.username,
      correo: payload.email,
      primer_nombre: payload.firstName,
      segundo_nombre: payload.secondName || null,
      primer_apellido: payload.lastName,
      segundo_apellido: payload.secondLastName || null,
      telefono: payload.phone || null,
      id_rol: payload.roleId,
    });

    return response.data?.user
      ? mapBackendUserToAdminUser(response.data.user)
      : null;
  },

  assignUserToBranch: async (branchId: number, userId: number) => {
    await api.post(`/api/sucursales/${branchId}/empleados`, {
      id_usuario: userId,
    });
  },

  changeUserBranch: async (userId: number, branchId: number) => {
    const response = await api.put(`/api/users/branch/${userId}`, {
      id_sucursal: branchId,
    });
    return response.data;
  },

  deactivateUser: async (id: string) => {
    const response = await api.put(`/api/users/desactivate/${id}`);
    return response.data?.user
      ? mapBackendUserToAdminUser(response.data.user)
      : null;
  },

  activateUser: async (id: string) => {
    const response = await api.put(`/api/users/activate/${id}`);
    return response.data?.user
      ? mapBackendUserToAdminUser(response.data.user)
      : null;
  },
};


const RolePill = ({ role }: { role: string }) => {
  return (
    <Tag className="rounded-full px-3 py-0.5 text-xs font-semibold border border-[#027EB1] text-[#027EB1] bg-[#E7F2FA]">
      {role}
    </Tag>
  );
};

export default function UsersAdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);

  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<number | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<UserStatus | "">("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const [createForm] = Form.useForm<CreateUserFormValues>();
  const [editForm] = Form.useForm<EditUserFormValues>();

  const createRoleId = Form.useWatch("roleId", createForm);
  const editRoleId = Form.useWatch("roleId", editForm);

  const roleOptions = useMemo(
    () => roles.map((role) => ({ label: role.nombre, value: role.id_rol })),
    [roles],
  );

  const branchOptions = useMemo(
    () => branches.map((branch) => ({ label: branch.nombre, value: branch.id_sucursal })),
    [branches],
  );

  const loadBranches = async () => {
    setBranchesLoading(true);
    try {
      const data = await getAllBranches();
      setBranches(data || []);
    } catch (error) {
      setBranches([]);
      message.error("No se pudieron cargar las sucursales");
    } finally {
      setBranchesLoading(false);
    }
  };

  const attachBranchIdsToUsers = async (baseUsers: AdminUser[]) => {
    try {
      const allBranches = await getAllBranches();
      const branchMap = new Map<number, number>();

      for (const branch of allBranches) {
        const employees = await getEmployeesForBranch(branch.id_sucursal);

        for (const employee of employees) {
          if (!branchMap.has(employee.id_usuario)) {
            branchMap.set(employee.id_usuario, branch.id_sucursal);
          }
        }
      }

      return baseUsers.map((user) => ({
        ...user,
        branchId: branchMap.get(user.backendId),
      }));
    } catch {
      return baseUsers;
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await apiUsers.listUsers();
      const usersWithBranch = await attachBranchIdsToUsers(data);
      setUsers(usersWithBranch);
    } catch (error: any) {
      message.error(error?.response?.data?.error || "No se pudieron cargar los usuarios");
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    setRolesLoading(true);
    try {
      const data = await fetchRoles();
      setRoles(data);
    } catch (error) {
      setRoles([]);
      message.error("No se pudieron cargar los roles");
    } finally {
      setRolesLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
    void loadRoles();
    void loadBranches();
  }, []);

  useEffect(() => {
    if (roles.length > 0 && !createForm.getFieldValue("roleId")) {
      createForm.setFieldValue("roleId", roles[0].id_rol);
    }
  }, [roles, createForm]);

  useEffect(() => {
    if (branches.length > 0 && !createForm.getFieldValue("branchId")) {
      createForm.setFieldValue("branchId", branches[0].id_sucursal);
    }
  }, [branches, createForm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [q, roleFilter, statusFilter]);

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();

    return users.filter((u) => {
      const fullName =
        `${u.firstName} ${u.secondName || ""} ${u.lastName} ${u.secondLastName || ""}`
          .trim()
          .toLowerCase();

      const matchesText =
        !text ||
        u.username.toLowerCase().includes(text) ||
        fullName.includes(text) ||
        u.email.toLowerCase().includes(text) ||
        u.phone.toLowerCase().includes(text);

      const matchesRole = !roleFilter || u.roleId === roleFilter;
      const matchesStatus = !statusFilter || u.status === statusFilter;

      return matchesText && matchesRole && matchesStatus;
    });
  }, [users, q, roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedUsers = filtered.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize,
  );

  const clearFilters = () => {
    setQ("");
    setRoleFilter(undefined);
    setStatusFilter("");
    setCurrentPage(1);
  };

  const openCreate = () => {
    createForm.resetFields();

    if (roles.length > 0) {
      createForm.setFieldValue("roleId", roles[0].id_rol);
    }

    if (branches.length > 0) {
      createForm.setFieldValue("branchId", branches[0].id_sucursal);
    }

    setCreateOpen(true);
  };

  const openEdit = (u: AdminUser) => {
    setSelectedUser(u);
    editForm.setFieldsValue({
      username: u.username,
      roleId: u.roleId,
      branchId: u.branchId,
      firstName: u.firstName,
      secondName: u.secondName,
      lastName: u.lastName,
      secondLastName: u.secondLastName,
      email: u.email,
      phone: normalizeHondurasPhone(u.phone),
    });
    setEditOpen(true);
  };

  // const openDeactivate = (u: AdminUser) => {
  //   setSelectedUser(u);
  //   setDeactivateOpen(true);
  // };

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      setLoading(true);

      const targetBranchId = Number(values.branchId);
      const payload = {
        username: values.username,
        roleId: Number(values.roleId),
        firstName: values.firstName,
        secondName: values.secondName,
        lastName: values.lastName,
        secondLastName: values.secondLastName,
        email: values.email,
        phone: normalizeHondurasPhone(values.phone),
        password: values.password,
      };

      const created = await apiUsers.createUser(payload);

      if (!created) {
        await loadUsers();
        message.success("Usuario creado correctamente");
        setCreateOpen(false);
        createForm.resetFields();
        return;
      }

      if (![4, 5].includes(Number(values.roleId)) && values.branchId) {
        try {
          await apiUsers.assignUserToBranch(targetBranchId, created.backendId);
        } catch (assignmentError: any) {
          await loadUsers();
          setCreateOpen(false);
          createForm.resetFields();
          message.warning(
            assignmentError?.response?.data?.error
              ? `Usuario creado, pero no se pudo asignar a la sucursal: ${assignmentError.response.data.error}`
              : "Usuario creado, pero no se pudo asignar a la sucursal seleccionada.",
          );
          return;
        }

        await loadUsers();
        setCurrentPage(1);
        message.success("Usuario creado y asignado correctamente a la sucursal seleccionada");
        setCreateOpen(false);
        createForm.resetFields();
        return;
      }

      await loadUsers();
      setCurrentPage(1);
      message.success("Usuario creado correctamente");
      setCreateOpen(false);
      createForm.resetFields();
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error(error?.response?.data?.error || error?.message || "No se pudo crear el usuario");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedUser) return;

    try {
      const values = await editForm.validateFields();
      setLoading(true);

      const payload = {
        username: values.username,
        roleId: Number(values.roleId),
        firstName: values.firstName,
        secondName: values.secondName,
        lastName: values.lastName,
        secondLastName: values.secondLastName,
        email: values.email,
        phone: normalizeHondurasPhone(values.phone),
      };

      const updated = await apiUsers.updateUser(selectedUser.id, payload);

      if (
        ![4, 5].includes(Number(values.roleId)) &&
        values.branchId &&
        Number(values.branchId) !== Number(selectedUser.branchId)
      ) {
        await apiUsers.changeUserBranch(selectedUser.backendId, Number(values.branchId));
      }

      if (updated) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === selectedUser.id
              ? {
                  ...updated,
                  branchId: [4, 5].includes(Number(values.roleId))
                    ? undefined
                    : Number(values.branchId),
                }
              : u,
          ),
        );
      } else {
        await loadUsers();
      }

      message.success("Usuario actualizado correctamente");
      setEditOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error(error?.response?.data?.error || "No se pudo actualizar el usuario");
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!selectedUser) return;

    try {
      setLoading(true);

      const updated =
        selectedUser.status === "Activo"
          ? await apiUsers.deactivateUser(selectedUser.id)
          : await apiUsers.activateUser(selectedUser.id);

      if (updated) {
        setUsers((prev) =>
          prev.map((u) => (u.id === selectedUser.id ? updated : u)),
        );
      } else {
        await loadUsers();
      }

      message.success(
        selectedUser.status === "Activo"
          ? "Usuario desactivado correctamente"
          : "Usuario activado correctamente",
      );

      setDeactivateOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      message.error(error?.response?.data?.error || "No se pudo cambiar el estado");
    } finally {
      setLoading(false);
    }
  };

  const actionButtons = (user: AdminUser) => (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => openEdit(user)}
        className="flex items-center justify-center text-[#3B82F6] hover:opacity-80 transition"
        title="Editar usuario"
      >
        <Pencil className="w-5 h-5" />
      </button>
    </div>
  );

  const columns: DataTableColumn<AdminUser>[] = [
    {
      title: "USUARIO",
      dataIndex: "username",
      key: "username",
      width: 160,
      render: (value) => (
        <span className="font-semibold text-slate-700">{String(value ?? "")}</span>
      ),
    },
    {
      title: "NOMBRE",
      key: "name",
      render: (_value, r) => (
        <span className="text-slate-700">
          {r.firstName} {r.lastName}
        </span>
      ),
    },
    { title: "TELÉFONO", dataIndex: "phone", key: "phone", width: 160 },
    { title: "CORREO", dataIndex: "email", key: "email" },
    {
      title: "ROL",
      dataIndex: "roleName",
      key: "roleName",
      width: 160,
      render: (value) => <RolePill role={String(value ?? "")} />,
    },
    {
      title: "ESTADO",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (_value, r) => (
        <Switch
          checked={r.status === "Activo"}
          loading={loading && selectedUser?.id === r.id}
          style={{ backgroundColor: r.status === "Activo" ? "#16A34A" : "#D1D5DB" }}
          onChange={() => {
            setSelectedUser(r);
            setDeactivateOpen(true);
          }}
        />
      ),
    },
    {
      title: "ACCIONES",
      key: "actions",
      width: 120,
      render: (_value, r) => actionButtons(r),
    },
  ];

  return (
  <ConfigProvider>
    <div className="w-full bg-[#F5F7FB] min-h-screen">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6">
        <div className="mb-5">
          <div className="text-2xl md:text-[32px] font-semibold text-[#1A1A1A] leading-8 md:leading-10">
            Administración de Usuarios
          </div>
          <div className="text-sm text-slate-500 mt-1">
            Gestiona las cuentas de usuario, asigna roles de acceso y supervisa el
            estado de actividad de los clientes en la plataforma.
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-5 md:p-6">
          <FilterBar
            search={{
              value: q,
              onChange: setQ,
              placeholder: "Buscar por usuario, nombre, correo o teléfono...",
            }}
            filters={[
              {
                placeholder: "Filtrar por rol",
                value: roleFilter,
                onChange: (v) => setRoleFilter(v as number | undefined),
                options: roleOptions,
              },
              {
                placeholder: "Filtrar por estado",
                value: statusFilter || undefined,
                onChange: (v) => setStatusFilter((v as UserStatus) || ""),
                options: STATUS_OPTIONS.map((s) => ({ label: s, value: s })),
              },
            ]}
            onClear={clearFilters}
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className="!h-12 !rounded-xl !align-middle !border-none !bg-[#027EB1] hover:!bg-[#026a96] !shadow-none w-full lg:w-auto !text-base !font-semibold !text-base"
              onClick={openCreate}
            >
              Crear usuario
            </Button>
          </FilterBar>
        </div>

        <div className="hidden md:block mt-5">
          <DataTable<AdminUser>
            rowKey="id"
            columns={columns}
            dataSource={paginatedUsers}
            loading={loading}
            className="rounded-2xl"
            pagination={{
              current: safeCurrentPage,
              pageSize,
              total: filtered.length,
              onChange: (page) => setCurrentPage(page),
            }}
          />
        </div>

        <div className="md:hidden mt-5 flex flex-col gap-3">
          {paginatedUsers.map((u) => (
            <div
              key={u.id}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-slate-800">{u.username}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {u.firstName} {u.lastName}
                  </div>
                </div>

                {actionButtons(u)}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="text-slate-500">Teléfono</div>
                <div className="text-slate-700 text-right">{u.phone}</div>

                <div className="text-slate-500">Correo</div>
                <div className="text-slate-700 text-right break-all">{u.email}</div>

                <div className="text-slate-500">Rol</div>
                <div className="text-right">
                  <RolePill role={u.roleName} />
                </div>

                <div className="text-slate-500">Estado</div>
                <div className="text-right">
                  <Switch
                    checked={u.status === "Activo"}
                    loading={loading && selectedUser?.id === u.id}
                    style={{ backgroundColor: u.status === "Activo" ? "#16A34A" : "#D1D5DB" }}
                    onChange={() => {
                      setSelectedUser(u);
                      setDeactivateOpen(true);
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal
        title={<div className="text-lg font-bold">Crear</div>}
        open={createOpen}
        onCancel={() => {
          setCreateOpen(false);
          createForm.resetFields();
        }}
        onOk={handleCreate}
        okText="Crear"
        cancelText="Cancelar"
        okButtonProps={{ className: "bg-[#027EB1]" }}
        width={720}
        confirmLoading={loading}
      >
        <Form
          form={createForm}
          layout="vertical"
          className="mt-2"
        >
          <Row gutter={12}>
            <Col xs={24} md={8}>
              <Form.Item
                label="Usuario *"
                name="username"
                rules={[{ required: true, message: "Ingresa el usuario" }]}
              >
                <Input placeholder="Ingrese el usuario aquí..." />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                label="Rol *"
                name="roleId"
                rules={[{ required: true, message: "Selecciona un rol" }]}
              >
                <Select
                  loading={rolesLoading}
                  options={roleOptions}
                  placeholder="Seleccione un rol"
                  disabled={roles.length === 0}
                />
              </Form.Item>
            </Col>
            {!([4, 5].includes(Number(createRoleId))) && (
              <Col xs={24} md={8}>
                <Form.Item
                  label="Sucursal *"
                  name="branchId"
                  rules={[{ required: true, message: "Selecciona una sucursal" }]}
                >
                  <Select
                    loading={branchesLoading}
                    options={branchOptions}
                    placeholder="Seleccione una sucursal"
                    disabled={branches.length === 0}
                  />
                </Form.Item>
              </Col>
            )}
          </Row>

          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Primer Nombre *"
                name="firstName"
                rules={[{ required: true, message: "Ingresa el primer nombre" }]}
              >
                <Input placeholder="Ingrese el Primer nombre aquí..." />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Segundo Nombre" name="secondName">
                <Input placeholder="Ingrese el Segundo nombre aquí..." />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Primer Apellido *"
                name="lastName"
                rules={[{ required: true, message: "Ingresa el primer apellido" }]}
              >
                <Input placeholder="Ingrese el Primer Apellido aquí..." />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Segundo Apellido" name="secondLastName">
                <Input placeholder="Ingrese el Segundo Apellido aquí..." />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Correo *"
                name="email"
                rules={[
                  { required: true, message: "Ingresa el correo" },
                  { type: "email", message: "Correo inválido" },
                ]}
              >
                <Input placeholder="Ingrese el Correo aquí..." />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Teléfono *" name="phone" rules={hondurasPhoneRules}>
                <Input
                  maxLength={8}
                  placeholder="Ingrese el teléfono aquí..."
                  onChange={(e) => {
                    createForm.setFieldValue(
                      "phone",
                      normalizeHondurasPhone(e.target.value),
                    );
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Contraseña *"
                name="password"
                rules={[
                  { required: true, message: "Ingresa la contraseña" },
                  {
                    validator: (_, value: string) => {
                      if (!value) return Promise.resolve();
                      const isValid =
                        value.length >= 8 &&
                        /[a-z]/.test(value) &&
                        /[A-Z]/.test(value) &&
                        /\d/.test(value) &&
                        /[^A-Za-z0-9]/.test(value);
                      if (isValid) return Promise.resolve();
                      return Promise.reject(
                        new Error("Debe tener 8+ caracteres, mayúscula, minúscula, número y símbolo"),
                      );
                    },
                  },
                ]}
              >
                <Input.Password placeholder="Ingrese la contraseña aquí..." />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Confirmar Contraseña *"
                name="confirmPassword"
                dependencies={["password"]}
                rules={[
                  { required: true, message: "Confirma la contraseña" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error("Las contraseñas no coinciden"),
                      );
                    },
                  }),
                ]}
              >
                <Input.Password placeholder="Confirme la contraseña aquí..." />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title={<div className="text-lg font-bold">Editar</div>}
        open={editOpen}
        onCancel={() => {
          setEditOpen(false);
          setSelectedUser(null);
        }}
        onOk={handleEdit}
        okText="Guardar"
        cancelText="Cancelar"
        okButtonProps={{ className: "bg-[#027EB1]" }}
        width={720}
        confirmLoading={loading}
      >
        <Form form={editForm} layout="vertical" className="mt-2">
          <Row gutter={12}>
            <Col xs={24} md={8}>
              <Form.Item
                label="Usuario *"
                name="username"
                rules={[{ required: true, message: "Ingresa el usuario" }]}
              >
                <Input placeholder="Ingrese el usuario aquí..." />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                label="Rol *"
                name="roleId"
                rules={[{ required: true, message: "Selecciona un rol" }]}
              >
                <Select
                  loading={rolesLoading}
                  options={roleOptions}
                  placeholder="Seleccione un rol"
                  disabled={roles.length === 0}
                />
              </Form.Item>
            </Col>
            {!([4, 5].includes(Number(editRoleId))) && (
              <Col xs={24} md={8}>
                <Form.Item
                  label="Sucursal *"
                  name="branchId"
                  rules={[{ required: true, message: "Selecciona una sucursal" }]}
                >
                  <Select
                    loading={branchesLoading}
                    options={branchOptions}
                    placeholder="Seleccione una sucursal"
                    disabled={branches.length === 0}
                  />
                </Form.Item>
              </Col>
            )}
          </Row>

          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Primer Nombre *"
                name="firstName"
                rules={[{ required: true, message: "Ingresa el primer nombre" }]}
              >
                <Input placeholder="Ingrese el Primer nombre aquí..." />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Segundo Nombre" name="secondName">
                <Input placeholder="Ingrese el Segundo nombre aquí..." />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Primer Apellido *"
                name="lastName"
                rules={[{ required: true, message: "Ingresa el primer apellido" }]}
              >
                <Input placeholder="Ingrese el Primer Apellido aquí..." />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Segundo Apellido" name="secondLastName">
                <Input placeholder="Ingrese el Segundo Apellido aquí..." />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Correo *"
                name="email"
                rules={[
                  { required: true, message: "Ingresa el correo" },
                  { type: "email", message: "Correo inválido" },
                ]}
              >
                <Input placeholder="Ingrese el Correo aquí..." />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Teléfono *" name="phone" rules={hondurasPhoneRules}>
                <Input
                  maxLength={8}
                  placeholder="Ingrese el teléfono aquí..."
                  onChange={(e) => {
                    editForm.setFieldValue(
                      "phone",
                      normalizeHondurasPhone(e.target.value),
                    );
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        open={deactivateOpen}
        onCancel={() => {
          setDeactivateOpen(false);
          setSelectedUser(null);
        }}
        footer={null}
        closable={false}
        centered
        width={420}
      >
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-auto p-6 md:p-8 text-center">
          <div className="flex justify-center mb-4">
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center ${
                selectedUser?.status === "Activo" ? "bg-red-50" : "bg-green-50"
              }`}
            >
              {selectedUser?.status === "Activo" ? (
                <AlertTriangle className="w-6 h-6 text-red-500" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              )}
            </div>
          </div>

          <h2 className="text-gray-900 font-bold text-lg mb-2">
            {selectedUser?.status === "Activo" ? "Desactivar Usuario" : "Activar Usuario"}
          </h2>

          <p className="text-sm text-gray-600 mb-1">
            {selectedUser?.status === "Activo"
              ? "¿Estás seguro que deseas desactivar el usuario "
              : "¿Estás seguro que deseas activar el usuario "}
            <span className="text-gray-900 font-semibold">
              '{selectedUser?.username}'
            </span>
            ?
          </p>

          <p className="text-sm text-gray-500 mb-6">
            {selectedUser?.status === "Activo"
              ? "Podrás volver a activarlo más adelante."
              : "El usuario volverá a tener acceso a la plataforma."}
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setDeactivateOpen(false);
                setSelectedUser(null);
              }}
              className="w-full md:w-auto px-6 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors order-2 md:order-1 font-medium"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleDeactivate}
              disabled={loading}
              className={`w-full md:w-auto px-6 py-2.5 text-white rounded-lg text-sm transition-colors order-1 md:order-2 font-medium disabled:opacity-70 ${
                selectedUser?.status === "Activo"
                  ? "bg-[#DC2626] hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {loading
                ? selectedUser?.status === "Activo"
                  ? "Desactivando..."
                  : "Activando..."
                : selectedUser?.status === "Activo"
                  ? "Desactivar"
                  : "Activar"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  </ConfigProvider>
  );
}