export interface Departamento {
    nombre_departamento: string;
};

export interface Municipio {
    nombre: string;
    departamento: Departamento;
};

export interface UsuarioSucursal {
    id_usuario: number;
    primer_nombre: string;
    primer_apellido: string;
};

export interface Sucursal {
    id_sucursal: number;
    nombre: string;
    RTN: string;
    activo: boolean;
    id_municipio: number;
    id_usuario: number;
    direccion: string;
    lat: number;
    lng: number;
    attendance_radius_m: number;
    max_gps_accuracy_m: number;
    location_configured: boolean;
    municipio: Municipio;
    usuario: UsuarioSucursal;
}

export interface EmpleadoSucursal {
    id_empleado_sucursal: number;
    id_usuario: number,
    id_sucursal: number,
    usuario: UsuarioSucursal
}

export interface Bodega {
    id_bodega: number;
    nombre: string,
    activo: boolean,
    id_sucursal: number,
    sucursal: {nombre: string, activo: boolean}
}
