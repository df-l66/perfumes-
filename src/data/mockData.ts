import type { Producto, Proveedor, Cliente, Venta, SalesDataPoint, Compra } from '../types';

export const mockProductos: Producto[] = [
  {
    id: 'p1', codigo: 'PER-001', nombre: 'Bleu de Chanel Eau de Parfum',
    categoria: 'Fragancias Masculinas', proveedor_id: 'pv1',
    precio_costo: 320000, precio_venta: 480000, stock: 15, stock_minimo: 5,
    estado: 'activo', unidad: 'Frasco', descripcion: 'Fragancia masculina premium amaderada con notas cítricas',
    calidad: 'Original', mililitros: 100,
    imagen: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'p2', codigo: 'PER-002', nombre: 'Creed Aventus',
    categoria: 'Fragancias Premium', proveedor_id: 'pv1',
    precio_costo: 680000, precio_venta: 950000, stock: 4, stock_minimo: 2,
    estado: 'activo', unidad: 'Frasco', descripcion: 'Fragancia nicho de lujo con notas de piña, abedul y almizcle',
    calidad: 'Original', mililitros: 100,
    imagen: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'p3', codigo: 'PER-003', nombre: 'Sauvage de Dior Eau de Toilette',
    categoria: 'Fragancias Masculinas', proveedor_id: 'pv2',
    precio_costo: 280000, precio_venta: 420000, stock: 22, stock_minimo: 8,
    estado: 'activo', unidad: 'Frasco', descripcion: 'Fragancia masculina fresca y especiada con bergamota de Calabria',
    calidad: 'Original', mililitros: 100,
    imagen: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'p4', codigo: 'PER-004', nombre: 'One Million Elixir',
    categoria: 'Fragancias Masculinas', proveedor_id: 'pv2',
    precio_costo: 240000, precio_venta: 380000, stock: 10, stock_minimo: 4,
    estado: 'activo', unidad: 'Frasco', descripcion: 'Fragancia intensa dulce con notas de vainilla y manzana',
    calidad: 'Original', mililitros: 100,
    imagen: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'p5', codigo: 'PER-005', nombre: 'J\'adore de Dior Eau de Parfum',
    categoria: 'Fragancias Femeninas', proveedor_id: 'pv2',
    precio_costo: 310000, precio_venta: 460000, stock: 12, stock_minimo: 3,
    estado: 'activo', unidad: 'Frasco', descripcion: 'Gran fragancia floral femenina de la casa Dior',
    calidad: 'Original', mililitros: 75,
    imagen: 'https://images.unsplash.com/photo-1588405748373-122b2321bc31?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'p6', codigo: 'PER-006', nombre: 'La Vie Est Belle EDP',
    categoria: 'Fragancias Femeninas', proveedor_id: 'pv3',
    precio_costo: 290000, precio_venta: 440000, stock: 18, stock_minimo: 5,
    estado: 'activo', unidad: 'Frasco', descripcion: 'Perfume femenino floral con notas de iris y pachulí',
    calidad: 'Original', mililitros: 75,
    imagen: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'p7', codigo: 'PER-007', nombre: 'Good Girl Carolina Herrera',
    categoria: 'Fragancias Femeninas', proveedor_id: 'pv3',
    precio_costo: 300000, precio_venta: 450000, stock: 8, stock_minimo: 4,
    estado: 'activo', unidad: 'Frasco', descripcion: 'Fragancia floral y oriental en su icónica botella de tacón',
    calidad: 'Original', mililitros: 80,
    imagen: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'p8', codigo: 'PER-008', nombre: 'Club de Nuit Intense Man',
    categoria: 'Fragancias Árabes', proveedor_id: 'pv3',
    precio_costo: 95000, precio_venta: 160000, stock: 35, stock_minimo: 10,
    estado: 'activo', unidad: 'Frasco', descripcion: 'Excelente alternativa a Creed Aventus de la casa Armaf',
    calidad: 'Original', mililitros: 105,
    imagen: 'https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'p9', codigo: 'PER-REP-01', nombre: 'Bleu de Chanel (1.1)',
    categoria: 'Fragancias Masculinas', proveedor_id: 'pv4',
    precio_costo: 45000, precio_venta: 85000, stock: 40, stock_minimo: 10,
    estado: 'activo', unidad: 'Frasco', descripcion: 'Réplica importada 1.1 con alta fijación y presentación similar',
    calidad: '1.1 Original', mililitros: 100,
    imagen: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'p10', codigo: 'PER-TES-02', nombre: 'Sauvage de Dior (Tester)',
    categoria: 'Fragancias Masculinas', proveedor_id: 'pv4',
    precio_costo: 180000, precio_venta: 270000, stock: 3, stock_minimo: 2,
    estado: 'activo', unidad: 'Frasco', descripcion: 'Probador original sin caja comercial',
    calidad: 'Tester', mililitros: 100,
    imagen: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=300&q=80'
  }
];

// ─── PROVEEDORES DE FRAGANCIAS ──────────────────────────────────────────────
export const mockProveedores: Proveedor[] = [
  {
    id: 'pv1', nombre: 'EuroFragances Importaciones', nit: '900.123.456-7',
    contacto: 'Andrea Morales', telefono: '601 3456789', email: 'ventas@eurofragances.co',
    ciudad: 'Bogotá', estado: 'activo'
  },
  {
    id: 'pv2', nombre: 'Distribuidora Aroma Global', nit: '800.654.321-0',
    contacto: 'Carlos Herrera', telefono: '604 2341567', email: 'pedidos@aromaglobal.co',
    ciudad: 'Medellín', estado: 'activo'
  },
  {
    id: 'pv3', nombre: 'Esencias de París S.A.S.', nit: '700.987.654-3',
    contacto: 'Liliana Ruiz', telefono: '602 7654321', email: 'lruiz@esenciasparis.com',
    ciudad: 'Cali', estado: 'activo'
  },
  {
    id: 'pv4', nombre: 'Réplicas y Testers del Eje', nit: '900.111.222-5',
    contacto: 'Jorge Pinilla', telefono: '601 9876543', email: 'info@replicaseje.co',
    ciudad: 'Bogotá', estado: 'activo'
  }
];

// ─── CLIENTES ─────────────────────────────────────────────────────────────────
export const mockClientes: Cliente[] = [
  {
    id: 'c1', nombre: 'Boutique Fraganza S.A.S.', tipo: 'empresa',
    documento: '900.345.678-2', email: 'compras@boutiquefraganza.com',
    telefono: '601 8765432', ciudad: 'Bogotá',
    direccion: 'Cra 15 # 93-47 Piso 3', fecha_registro: '2024-01-15',
    limite_credito: 5000000, credito_usado: 1200000
  },
  {
    id: 'c2', nombre: 'María Fernanda Ospina', tipo: 'persona',
    documento: '52.345.678', email: 'mfospina@gmail.com',
    telefono: '312 3456789', ciudad: 'Bogotá',
    direccion: 'Cll 100 # 19-35 Apt 402', fecha_registro: '2024-02-20',
    limite_credito: 1000000, credito_usado: 250000
  },
  {
    id: 'c3', nombre: 'Hotel San Rafael Premium', tipo: 'empresa',
    documento: '800.234.567-9', email: 'compras@sanrafaelpremium.co',
    telefono: '601 4567890', ciudad: 'Bogotá',
    direccion: 'Cll 64 # 28-20', fecha_registro: '2024-03-05',
    limite_credito: 8000000, credito_usado: 0
  },
  {
    id: 'c4', nombre: 'Pedro Alonso Martínez', tipo: 'persona',
    documento: '79.876.543', email: 'palmartinez@hotmail.com',
    telefono: '314 6789012', ciudad: 'Medellín',
    direccion: 'Carrera 43A # 19-20 Apt 201', fecha_registro: '2024-03-18',
    limite_credito: 500000, credito_usado: 150000
  }
];

// ─── VENTAS ───────────────────────────────────────────────────────────────────
export const mockVentas: Venta[] = [
  {
    id: 'v1', factura: 'FAC-2025-0001', cliente_id: 'c1', cliente_nombre: 'Boutique Fraganza S.A.S.',
    vendedor_id: 'u2', vendedor_nombre: 'Laura Gómez',
    fecha: '2025-06-18', total: 1045000, estado: 'completada',
    items: [
      { producto_id: 'p1', nombre: 'Bleu de Chanel Eau de Parfum', cantidad: 2, precio_unitario: 480000, subtotal: 960000 },
      { producto_id: 'p9', nombre: 'Bleu de Chanel (1.1)', cantidad: 1, precio_unitario: 85000, subtotal: 85000 }
    ]
  },
  {
    id: 'v2', factura: 'FAC-2025-0002', cliente_id: 'c3', cliente_nombre: 'Hotel San Rafael Premium',
    vendedor_id: 'u1', vendedor_nombre: 'Admin Sistema',
    fecha: '2025-06-20', total: 1300000, estado: 'completada',
    items: [
      { producto_id: 'p2', nombre: 'Creed Aventus', cantidad: 1, precio_unitario: 950000, subtotal: 950000 },
      { producto_id: 'p10', nombre: 'Sauvage de Dior (Tester)', cantidad: 1, precio_unitario: 270000, subtotal: 270000 },
      { producto_id: 'p9', nombre: 'Bleu de Chanel (1.1)', cantidad: 1, precio_unitario: 85000, subtotal: 85000 }
    ]
  },
  {
    id: 'v3', factura: 'FAC-2025-0003', cliente_id: 'c2', cliente_nombre: 'María Fernanda Ospina',
    vendedor_id: 'u2', vendedor_nombre: 'Laura Gómez',
    fecha: '2025-06-22', total: 525000, estado: 'completada',
    items: [
      { producto_id: 'p6', nombre: 'La Vie Est Belle EDP', cantidad: 1, precio_unitario: 440000, subtotal: 440000 },
      { producto_id: 'p9', nombre: 'Bleu de Chanel (1.1)', cantidad: 1, precio_unitario: 85000, subtotal: 85000 }
    ]
  },
  {
    id: 'v4', factura: 'FAC-2025-0004', cliente_id: 'c4', cliente_nombre: 'Pedro Alonso Martínez',
    vendedor_id: 'u2', vendedor_nombre: 'Laura Gómez',
    fecha: '2025-06-24', total: 420000, estado: 'completada',
    items: [
      { producto_id: 'p3', nombre: 'Sauvage de Dior Eau de Toilette', cantidad: 1, precio_unitario: 420000, subtotal: 420000 }
    ]
  },
  {
    id: 'v5', factura: 'FAC-2025-0005', cliente_id: 'c1', cliente_nombre: 'Boutique Fraganza S.A.S.',
    vendedor_id: 'u1', vendedor_nombre: 'Admin Sistema',
    fecha: '2025-06-26', total: 1390000, estado: 'completada',
    items: [
      { producto_id: 'p2', nombre: 'Creed Aventus', cantidad: 1, precio_unitario: 950000, subtotal: 950000 },
      { producto_id: 'p6', nombre: 'La Vie Est Belle EDP', cantidad: 1, precio_unitario: 440000, subtotal: 440000 }
    ]
  },
  {
    id: 'v6', factura: 'FAC-2025-0006', cliente_id: 'c2', cliente_nombre: 'María Fernanda Ospina',
    vendedor_id: 'u2', vendedor_nombre: 'Laura Gómez',
    fecha: '2025-06-30', total: 610000, estado: 'pendiente',
    items: [
      { producto_id: 'p7', nombre: 'Good Girl Carolina Herrera', cantidad: 1, precio_unitario: 450000, subtotal: 450000 },
      { producto_id: 'p8', nombre: 'Club de Nuit Intense Man', cantidad: 1, precio_unitario: 160000, subtotal: 160000 }
    ]
  }
];

// ─── SALES CHART DATA ────────────────────────────────────────────────────────
export const mockSalesChart: SalesDataPoint[] = [
  { fecha: '18 Jun', total: 1045000, cantidad: 2 },
  { fecha: '19 Jun', total: 0, cantidad: 0 },
  { fecha: '20 Jun', total: 1300000, cantidad: 3 },
  { fecha: '21 Jun', total: 0, cantidad: 0 },
  { fecha: '22 Jun', total: 525000, cantidad: 2 },
  { fecha: '23 Jun', total: 0, cantidad: 0 },
  { fecha: '24 Jun', total: 420000, cantidad: 1 },
  { fecha: '25 Jun', total: 0, cantidad: 0 },
  { fecha: '26 Jun', total: 1390000, cantidad: 2 },
  { fecha: '27 Jun', total: 0, cantidad: 0 },
  { fecha: '28 Jun', total: 0, cantidad: 0 },
  { fecha: '29 Jun', total: 0, cantidad: 0 },
  { fecha: '30 Jun', total: 610000, cantidad: 2 },
  { fecha: '1 Jul', total: 0, cantidad: 0 }
];

// ─── COMPRAS MOCK ─────────────────────────────────────────────────────────────
export const mockCompras: Compra[] = [
  {
    id: 'com1',
    factura_compra: 'COM-2025-0001',
    proveedor_id: 'pv1',
    proveedor_nombre: 'EuroFragances Importaciones',
    fecha: '2025-06-15',
    items: [
      { producto_id: 'p1', nombre: 'Bleu de Chanel Eau de Parfum', cantidad: 10, precio_costo: 320000, subtotal: 3200000 },
      { producto_id: 'p2', nombre: 'Creed Aventus', cantidad: 3, precio_costo: 680000, subtotal: 2040000 }
    ],
    total: 5240000,
    estado: 'completada',
    comprador_id: 'u1',
    comprador_nombre: 'Admin Sistema',
    notas: 'Importación premium directa de perfumería fina.'
  },
  {
    id: 'com2',
    factura_compra: 'COM-2025-0002',
    proveedor_id: 'pv4',
    proveedor_nombre: 'Réplicas y Testers del Eje',
    fecha: '2025-06-22',
    items: [
      { producto_id: 'p9', nombre: 'Bleu de Chanel (1.1)', cantidad: 20, precio_costo: 45000, subtotal: 900000 },
      { producto_id: 'p10', nombre: 'Sauvage de Dior (Tester)', cantidad: 5, precio_costo: 180000, subtotal: 900000 }
    ],
    total: 1800000,
    estado: 'completada',
    comprador_id: 'u1',
    comprador_nombre: 'Admin Sistema',
    notas: 'Abastecimiento de testers y copias triple A de alta rotación.'
  }
];
