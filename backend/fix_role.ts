import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zoojbnvxnnsymmdvmaqj.supabase.co';
const supabaseKey = 'sb_secret_8e0HpmppwWmN4tJA8Csbag_BHtNEbqK'; // from backend/.env

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function run() {
  console.log('Fetching users...');
  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
  
  if (usersError) {
    console.error('Error fetching auth.users:', usersError);
    return;
  }

  const users = usersData.users;
  console.log(`Found ${users.length} users.`);

  for (const user of users) {
    console.log(`Ensuring profile for user ${user.email} (${user.id})...`);
    
    // Check if profile exists
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    
    if (!profile) {
      console.log(`Profile not found for ${user.email}. Creating as admin...`);
      const { error: insertError } = await supabase.from('profiles').insert({
        id: user.id,
        email: user.email,
        nombre: 'Admin Principal',
        rol: 'admin'
      });
      
      if (insertError) {
        console.error(`Failed to create profile:`, insertError);
      } else {
        console.log(`Profile created successfully for ${user.email}!`);
      }
    } else {
      console.log(`Profile exists for ${user.email}. Current role: ${profile.rol}. Updating to admin...`);
      const { error: updateError } = await supabase.from('profiles').update({ rol: 'admin' }).eq('id', user.id);
      if (updateError) {
        console.error(`Failed to update profile:`, updateError);
      } else {
        console.log(`Profile updated to admin successfully for ${user.email}!`);
      }
    }
  }
}

run();
