import { useEffect, useRef, useState } from "react";
import { Alert, Button, Card, Select, Tabs, Table, message } from "antd";
import { getBiometricRequests, getBiometricApiErrorMessage, registerBiometric, reviewBiometricRequest, type BiometricRequest } from "../../api/attendance/attendance";
import { getAllBranches, getEmployeesForBranch } from "../../api/branches/branches";
import FaceCamera, { type FaceCameraHandle } from "../../components/FaceCamera";

export default function AdminBiometrics() {
  const cameraRef = useRef<FaceCameraHandle>(null);
  const [msg, contextHolder] = message.useMessage();
  const [employees, setEmployees] = useState<Array<{ id_usuario: number; nombre: string }>>([]);
  const [selectedUser, setSelectedUser] = useState<number>();
  const [requests, setRequests] = useState<BiometricRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  useEffect(() => {
    void getAllBranches().then(async (branches) => {
      const people = (await Promise.all(branches.map((branch) => getEmployeesForBranch(branch.id_sucursal)))).flat();
      const unique = new Map(people.map((person) => [person.id_usuario, person]));
      setEmployees(Array.from(unique.values()).map((person) => ({ id_usuario: person.id_usuario, nombre: `${person.usuario.primer_nombre} ${person.usuario.primer_apellido}` })));
    }).catch(() => msg.error("No se pudo cargar la configuración de biometría"));
  }, [msg]);

  const loadRequests = async () => {
    setLoadingRequests(true);
    try {
      setRequests(await getBiometricRequests());
    } catch {
      msg.error("No se pudieron cargar las solicitudes pendientes");
    } finally {
      setLoadingRequests(false);
    }
  };

  const review = async (request: BiometricRequest, decision: "approve" | "reject") => {
    try {
      await reviewBiometricRequest(request.id_solicitud, decision);
      msg.success(decision === "approve" ? "Solicitud aprobada" : "Solicitud rechazada");
      await loadRequests();
    } catch {
      msg.error("No se pudo revisar la solicitud");
    }
  };

  const save = async (image: string) => {
    if (!selectedUser) {
      msg.warning("Selecciona un empleado");
      throw new Error("USER_REQUIRED");
    }
    try {
      await registerBiometric(selectedUser, image);
      msg.success("Rostro registrado correctamente");
    } catch (error: unknown) {
      msg.error(getBiometricApiErrorMessage(error, "No se pudo registrar el rostro"));
      throw error;
    }
  };

  return <div className="min-h-screen bg-[#F3F6FA] px-4 py-8">{contextHolder}<div className="mx-auto max-w-4xl"><Tabs items={[{ key: "register", label: "Registrar rostro", children: <Card><Alert className="mb-4" type="info" showIcon title="La captura se usa para registrar una sola biometría cifrada por empleado." /><Select className="mb-4 w-full" placeholder="Selecciona un empleado" value={selectedUser} options={employees.map((employee) => ({ value: employee.id_usuario, label: employee.nombre }))} onChange={setSelectedUser} /><FaceCamera mode="enrollment" ref={cameraRef} onEnrollmentConfirm={save} /></Card> }, { key: "requests", label: "Solicitudes pendientes", children: <Card><Button className="mb-4" onClick={() => void loadRequests()} loading={loadingRequests}>Actualizar solicitudes</Button><Table rowKey="id_solicitud" loading={loadingRequests} dataSource={requests} pagination={false} columns={[{ title: "Empleado", dataIndex: "empleado" }, { title: "Sucursal", dataIndex: "sucursal" }, { title: "Fecha", dataIndex: "created_at", render: (value: string) => new Date(value).toLocaleString("es-HN") }, { title: "Acciones", key: "actions", render: (_value: unknown, request: BiometricRequest) => <div className="flex gap-2"><Button type="primary" onClick={() => void review(request, "approve")}>Aprobar</Button><Button danger onClick={() => void review(request, "reject")}>Rechazar</Button></div> }]} /></Card> }]} /></div></div>;
}
