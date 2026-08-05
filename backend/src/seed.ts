import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Faltan credenciales de Supabase en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const mockProveedores = [
  {
    id: '11111111-1111-4111-8111-111111111111', 
    nombre: 'EuroFragances Importaciones', nit: '900.123.456-7',
    contacto: 'Andrea Morales', telefono: '601 3456789', email: 'ventas@eurofragances.co',
    ciudad: 'Bogotá', estado: 'activo'
  },
  {
    id: '22222222-2222-4222-8222-222222222222', 
    nombre: 'Distribuidora Aroma Global', nit: '800.654.321-0',
    contacto: 'Carlos Herrera', telefono: '604 2341567', email: 'pedidos@aromaglobal.co',
    ciudad: 'Medellín', estado: 'activo'
  },
  {
    id: '33333333-3333-4333-8333-333333333333', 
    nombre: 'Esencias de París S.A.S.', nit: '700.987.654-3',
    contacto: 'Liliana Ruiz', telefono: '602 7654321', email: 'lruiz@esenciasparis.com',
    ciudad: 'Cali', estado: 'activo'
  },
  {
    id: '44444444-4444-4444-8444-444444444444', 
    nombre: 'Réplicas y Testers del Eje', nit: '900.111.222-5',
    contacto: 'Jorge Pinilla', telefono: '601 9876543', email: 'info@replicaseje.co',
    ciudad: 'Bogotá', estado: 'activo'
  }
];

const mockProductos = [
  {
    codigo: 'PER-001', nombre: 'Bleu de Chanel Eau de Parfum',
    categoria: 'Fragancias Masculinas', proveedor_id: '11111111-1111-4111-8111-111111111111',
    precio_costo: 320000, precio_venta: 480000, stock: 15, stock_minimo: 5,
    estado: 'activo', unidad: 'Frasco', descripcion: 'Fragancia masculina premium amaderada con notas cítricas',
    calidad: 'Original', mililitros: 100,
    imagen: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=300&q=80'
  },
  {
    codigo: 'PER-002', nombre: 'Creed Aventus',
    categoria: 'Fragancias Premium', proveedor_id: '11111111-1111-4111-8111-111111111111',
    precio_costo: 680000, precio_venta: 950000, stock: 4, stock_minimo: 2,
    estado: 'activo', unidad: 'Frasco', descripcion: 'Fragancia nicho de lujo con notas de piña, abedul y almizcle',
    calidad: 'Original', mililitros: 100,
    imagen: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=300&q=80'
  },
  {
    codigo: 'PER-003', nombre: 'Sauvage de Dior Eau de Toilette',
    categoria: 'Fragancias Masculinas', proveedor_id: '22222222-2222-4222-8222-222222222222',
    precio_costo: 280000, precio_venta: 420000, stock: 22, stock_minimo: 8,
    estado: 'activo', unidad: 'Frasco', descripcion: 'Fragancia masculina fresca y especiada con bergamota de Calabria',
    calidad: 'Original', mililitros: 100,
    imagen: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=300&q=80'
  },
  {
    codigo: 'PER-004', nombre: 'One Million Elixir',
    categoria: 'Fragancias Masculinas', proveedor_id: '22222222-2222-4222-8222-222222222222',
    precio_costo: 240000, precio_venta: 380000, stock: 10, stock_minimo: 4,
    estado: 'activo', unidad: 'Frasco', descripcion: 'Fragancia intensa dulce con notas de vainilla y manzana',
    calidad: 'Original', mililitros: 100,
    imagen: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=300&q=80'
  },
  {
    codigo: 'PER-005', nombre: 'J\'adore de Dior Eau de Parfum',
    categoria: 'Fragancias Femeninas', proveedor_id: '22222222-2222-4222-8222-222222222222',
    precio_costo: 310000, precio_venta: 460000, stock: 12, stock_minimo: 3,
    estado: 'activo', unidad: 'Frasco', descripcion: 'Gran fragancia floral femenina de la casa Dior',
    calidad: 'Original', mililitros: 75,
    imagen: 'https://images.unsplash.com/photo-1588405748373-122b2321bc31?auto=format&fit=crop&w=300&q=80'
  }
];

const mockClientes = [
  {
    nombre: 'Boutique Fraganza S.A.S.', tipo: 'empresa',
    documento: '900.345.678-2', email: 'compras@boutiquefraganza.com',
    telefono: '601 8765432', ciudad: 'Bogotá',
    direccion: 'Cra 15 # 93-47 Piso 3', fecha_registro: '2024-01-15',
    limite_credito: 5000000, credito_usado: 1200000
  },
  {
    nombre: 'María Fernanda Ospina', tipo: 'persona',
    documento: '52.345.678', email: 'mfospina@gmail.com',
    telefono: '312 3456789', ciudad: 'Bogotá',
    direccion: 'Cll 100 # 19-35 Apt 402', fecha_registro: '2024-02-20',
    limite_credito: 1000000, credito_usado: 250000
  }
];

const mockMateriasPrimasSeed = [
  {
    nombre: 'Esencia Concentrada Fragancia Árabe',
    tipo: 'esencia',
    unidad_medida: 'ml',
    stock: 5000,
    stock_minimo: 1000,
    costo_unitario: 150,
    estado: 'activo',
    imagen: 'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&w=300&q=80'
  },
  {
    nombre: 'Alcohol Desnaturalizado Grado Perfumería 96%',
    tipo: 'alcohol',
    unidad_medida: 'ml',
    stock: 25000,
    stock_minimo: 5000,
    costo_unitario: 25,
    estado: 'activo',
    imagen: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=300&q=80'
  },
  {
    nombre: 'Fijador de Aroma DPG (Dipropilenglicol)',
    tipo: 'fijador',
    unidad_medida: 'ml',
    stock: 3000,
    stock_minimo: 800,
    costo_unitario: 80,
    estado: 'activo',
    imagen: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=300&q=80'
  },
  {
    nombre: 'Frasco de Vidrio de Lujo 100ml Gold',
    tipo: 'envase',
    unidad_medida: 'ud',
    stock: 450,
    stock_minimo: 100,
    costo_unitario: 4500,
    estado: 'activo',
    imagen: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=300&q=80'
  }
];

async function seed() {
  console.log('🌱 Poblando base de datos en Supabase...');

  try {
    const { error: errProv } = await supabase.from('proveedores').insert(mockProveedores);
    if (errProv) console.error('Info/Warn al insertar proveedores:', errProv.message);
    else console.log('✅ Proveedores insertados correctamente');

    const { error: errProd } = await supabase.from('productos').insert(mockProductos);
    if (errProd) console.error('Info/Warn al insertar productos:', errProd.message);
    else console.log('✅ Productos insertados correctamente');

    const { error: errCli } = await supabase.from('clientes').insert(mockClientes);
    if (errCli) console.error('Info/Warn al insertar clientes:', errCli.message);
    else console.log('✅ Clientes insertados correctamente');

    const { error: errMp } = await supabase.from('materias_primas').insert(mockMateriasPrimasSeed);
    if (errMp) console.error('Info/Warn al insertar materias primas:', errMp.message);
    else console.log('✅ Materias primas insertadas correctamente');

    console.log('🎉 Proceso de sembrado completado con éxito.');
  } catch (err: any) {
    console.error('Error ejecutando seed:', err);
  }
}

seed();
