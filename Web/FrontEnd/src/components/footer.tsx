import React from 'react';
import { Typography, Row, Col } from 'antd';
import { 
  EnvironmentOutlined, 
  LinkOutlined, 
  PhoneOutlined,
  ClockCircleOutlined 
} from '@ant-design/icons';

const { Text, Paragraph } = Typography;

interface FooterProps {
  description?: string;
}

export default function Footer(props: FooterProps): React.JSX.Element {
  return (
    // 1. Aseguramos que el contenedor padre ocupe todo el ancho
    // y ocultamos cualquier desbordamiento horizontal.
    <div className='w-full overflow-x-hidden'>

      {/* Main Footer */}
      {/* 2. Añadimos un padding responsivo para evitar salir del borde en móvil */}
      <div className='bg-[#027EB1] px-4 md:px-10 pt-10 pb-8'>
        <Row gutter={[24, 24]}> {/* 3. Reducimos el gutter ligeramente para evitar desbordamiento */}

          {/* Logo & Slogan */}
          <Col xs={24} sm={12} md={12} lg={6}>
            <img className="w-24 mb-3" src="/white_logo.svg" alt="Inversan" />
            <Paragraph className='!text-left text-white text-sm'>
              Líderes en distribución de llantas para todo tipo de vehículos. 
              Calidad y servicio garantizados.
            </Paragraph>
          </Col>

          {/* Contacto */}
          <Col xs={24} sm={12} md={12} lg={6}>
            <Text className='text-white font-semibold text-base'>
              Contacto
            </Text>

            <div className='flex flex-col gap-3 mt-4'>

              <div className='flex items-center gap-2'>
                <PhoneOutlined className='flex items-center justify-center bg-white bg-opacity-10 rounded-full w-6 h-6 text-white text-base' />
                <Text className='text-white text-sm'>
                  (+504) 9524-0039
                </Text>
              </div>

              <div className='flex items-center gap-2'>
                <LinkOutlined className='flex items-center justify-center bg-white bg-opacity-10 rounded-full w-6 h-6 text-white text-base' />
                <a className='text-white text-sm'>
                  davidsanchezflores@hotmail.com
                </a>
              </div>

              <div className='flex items-start gap-2'>
                <div className='
                  flex 
                  items-center 
                  justify-center 
                  w-8 h-6 
                  min-w-[24px]
                  rounded-full 
                  bg-white/10
                '>
                  <EnvironmentOutlined className='text-white text-base' />
                </div>
                <Paragraph className='!text-left text-white text-sm'>
                  {props?.description || 
                    'Santa Rosa de Copan. Col. Santa Rosa Eduvijes, Frente Carretera Internacional, 100 metros al Sur de la Gasolinera Puma El Duende.'}
                </Paragraph>
              </div>

            </div>
          </Col>

          {/* Horarios */}
          <Col xs={24} sm={12} md={12} lg={6}>
            <Text className='text-white font-semibold text-base'>
              Horarios
            </Text>

            <div className='flex flex-col gap-3 mt-4'>

              <div className='flex items-center gap-2'>
                <ClockCircleOutlined className='flex items-center justify-center bg-white bg-opacity-10 rounded-full w-6 h-6 text-white text-base' />
                <Text className='text-white text-sm'>
                  Lunes - Viernes: 7:30 AM - 5:00 PM
                </Text>
              </div>

              <div className='flex items-center gap-2'>
                <ClockCircleOutlined className='flex items-center justify-center bg-white bg-opacity-10 rounded-full w-6 h-6 text-white text-base' />
                <Text className='text-white text-sm'>
                  Sábados: 7:30 AM - 12:00 PM
                </Text>
              </div>

              <div className='flex items-center gap-2'>
                <ClockCircleOutlined className='flex items-center justify-center bg-white bg-opacity-10 rounded-full w-6 h-6 text-white text-sm' />
                <Text className='text-white text-sm'>
                  Domingos: Cerrado
                </Text>
              </div>

            </div>
          </Col>

          {/* Política */}
          <Col xs={24} sm={12} md={12} lg={6}>
            <Text className='!text-left text-white font-semibold text-base'>
              Política de Devoluciones
            </Text>

            <Paragraph className='!text-left text-white text-sm mt-4'>
              Aceptamos devoluciones dentro de los 30 días posteriores a la compra. 
              El producto debe estar en su estado original y sin usar.
            </Paragraph>
          </Col>

        </Row>
      </div>

      {/* Bottom Bar */}
      {/* 4. Aseguramos que esta barra tampoco desborde */}
      <div className='bg-[#003E7B] text-center py-4 px-4'>
        <Text className='text-white text-sm'>
          © Copyright INVERSAN, 2026
        </Text>
      </div>
    </div>
  );
}