-- Función para registrar una venta completa de forma transaccional y atómica
-- Esto evita condiciones de carrera y asegura que no queden datos huérfanos.

CREATE OR REPLACE FUNCTION registrar_venta_transaccion(venta_data JSONB, items_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_venta_id UUID;
    v_item JSONB;
    v_stock_actual NUMERIC;
    v_stock_minimo NUMERIC;
    v_nuevo_stock NUMERIC;
    v_estado_producto TEXT;
    v_venta_record RECORD;
BEGIN
    -- 1. Insertar la venta principal
    INSERT INTO ventas (
        factura, cliente_id, cliente_nombre, vendedor_id, vendedor_nombre,
        total, metodo_pago, notas, estado
    ) VALUES (
        venta_data->>'factura',
        NULLIF(venta_data->>'cliente_id', '')::UUID,
        venta_data->>'cliente_nombre',
        (venta_data->>'vendedor_id')::UUID,
        venta_data->>'vendedor_nombre',
        (venta_data->>'total')::NUMERIC,
        venta_data->>'metodo_pago',
        venta_data->>'notas',
        COALESCE(venta_data->>'estado', 'completada')
    ) RETURNING * INTO v_venta_record;

    v_venta_id := v_venta_record.id;

    -- 2. Procesar cada item de la venta
    FOR v_item IN SELECT * FROM jsonb_array_elements(items_data)
    LOOP
        -- 2.1 Insertar detalle de la venta
        INSERT INTO venta_detalles (
            venta_id, producto_id, nombre, cantidad, precio_unitario, subtotal
        ) VALUES (
            v_venta_id,
            (v_item->>'producto_id')::UUID,
            v_item->>'nombre',
            (v_item->>'cantidad')::INTEGER,
            (v_item->>'precio_unitario')::NUMERIC,
            (v_item->>'subtotal')::NUMERIC
        );

        -- 2.2 Bloquear fila del producto y leer el stock actual (Previene Condiciones de Carrera)
        SELECT stock, stock_minimo INTO v_stock_actual, v_stock_minimo 
        FROM productos 
        WHERE id = (v_item->>'producto_id')::UUID 
        FOR UPDATE;

        IF v_stock_actual IS NOT NULL THEN
            -- 2.3 Calcular nuevo stock y estado
            v_nuevo_stock := v_stock_actual - (v_item->>'cantidad')::INTEGER;
            
            IF v_nuevo_stock <= 0 THEN
                v_estado_producto := 'inactivo';
            ELSIF v_nuevo_stock <= v_stock_minimo THEN
                v_estado_producto := 'stock_bajo';
            ELSE
                v_estado_producto := 'activo';
            END IF;

            -- 2.4 Actualizar el producto
            UPDATE productos 
            SET stock = v_nuevo_stock, estado = v_estado_producto
            WHERE id = (v_item->>'producto_id')::UUID;

            -- 2.5 Registrar en el Kardex
            INSERT INTO movimientos_kardex (
                producto_id, producto_nombre, tipo, cantidad, 
                stock_anterior, stock_nuevo, referencia, registrado_por
            ) VALUES (
                (v_item->>'producto_id')::UUID,
                v_item->>'nombre',
                'salida',
                (v_item->>'cantidad')::INTEGER,
                v_stock_actual,
                v_nuevo_stock,
                'Venta ' || v_venta_record.factura,
                venta_data->>'vendedor_nombre'
            );
        END IF;
    END LOOP;

    -- 3. Actualizar crédito del cliente si es una venta a crédito
    IF (venta_data->>'metodo_pago') = 'credito' AND NULLIF(venta_data->>'cliente_id', '') IS NOT NULL THEN
        UPDATE clientes 
        SET credito_usado = COALESCE(credito_usado, 0) + (venta_data->>'total')::NUMERIC
        WHERE id = (venta_data->>'cliente_id')::UUID;
    END IF;

    -- Devolver el registro de la venta insertada convertido a JSON
    RETURN row_to_json(v_venta_record)::JSONB;
END;
$$;
