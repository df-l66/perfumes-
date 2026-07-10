import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export const createUser = async (req: Request, res: Response) => {
  const { email, password, nombre, rol } = req.body;

  try {
    // 1. Crear usuario usando la Admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Para que no pida confirmación por correo
    });

    if (authError) {
      console.error('Error creando auth user:', authError);
      return res.status(400).json({ message: 'Error creando usuario de autenticación', error: authError.message });
    }

    // 2. Insertar su perfil en la tabla profiles
    const userId = authData.user.id;
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        email,
        nombre,
        rol,
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Error creando perfil:', profileError);
      // Opcional: Eliminar usuario de auth si falla el perfil
      await supabase.auth.admin.deleteUser(userId);
      return res.status(400).json({ message: 'Error creando perfil, revirtiendo usuario', error: profileError.message });
    }

    res.status(201).json({ message: 'Usuario creado exitosamente', user: authData.user });
  } catch (error: any) {
    console.error('Error inesperado en createUser:', error);
    res.status(500).json({ message: 'Error interno al crear usuario', error: error.message });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) throw error;
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al obtener usuarios', error: error.message });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { email, password, nombre, rol } = req.body;

  try {
    // 1. Si enviaron un nuevo email o password, usar Admin API para actualizar credenciales
    if (email || password) {
      const updateData: any = {};
      if (email) updateData.email = email;
      if (password) updateData.password = password;

      const { error: authError } = await supabase.auth.admin.updateUserById(id as string, updateData);
      
      if (authError) {
        console.error('Error actualizando auth user:', authError);
        return res.status(400).json({ message: 'Error al actualizar credenciales de acceso', error: authError.message });
      }
    }

    // 2. Actualizar la tabla profiles con el nuevo rol, nombre y email
    const { data, error: profileError } = await supabase
      .from('profiles')
      .update({
        nombre,
        rol,
        ...(email ? { email } : {})
      })
      .eq('id', id)
      .select()
      .single();

    if (profileError) {
      console.error('Error actualizando perfil:', profileError);
      return res.status(400).json({ message: 'Error al actualizar el perfil de usuario', error: profileError.message });
    }

    res.status(200).json({ message: 'Usuario actualizado exitosamente', user: data });
  } catch (error: any) {
    console.error('Error inesperado en updateUser:', error);
    res.status(500).json({ message: 'Error interno al actualizar usuario', error: error.message });
  }
};
