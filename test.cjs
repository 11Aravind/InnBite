const https = require('https');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf-8');
const env = envFile.split('\n').reduce((acc, line) => {
    const [key, ...value] = line.split('=');
    if (key && value) acc[key.trim()] = value.join('=').trim();
    return acc;
}, {});

function fetchSupabase(table) {
    return new Promise((resolve, reject) => {
        const url = new URL(`/rest/v1/${table}?select=*`, env.VITE_SUPABASE_URL);
        const options = {
            headers: {
                'apikey': env.VITE_SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${env.VITE_SUPABASE_ANON_KEY}`
            }
        };

        https.get(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    console.error(`Error fetching ${table}:`, res.statusCode, data);
                    resolve([]);
                } else {
                    resolve(JSON.parse(data));
                }
            });
        }).on('error', err => {
            console.error(err);
            resolve([]);
        });
    });
}

async function simulateLogin(usernameOrEmail, password) {
    console.log(`Attempting login for: ${usernameOrEmail}`);
    const [waiters, admins] = await Promise.all([
        fetchSupabase('waiters'),
        fetchSupabase('admins')
    ]);
    
    console.log(`Found ${waiters.length} waiters and ${admins.length} admins.`);

    const allUsers = [...(admins || []), ...(waiters || [])];
    const identifier = usernameOrEmail?.toLowerCase()?.trim();
    
    const matchedUser = allUsers.find(u => 
        (u.username?.toLowerCase() === identifier || u.email?.toLowerCase() === identifier) && 
        u.password === password
    );

    if (matchedUser) {
        console.log('Login SUCCESS! User:', matchedUser.name, 'Role:', matchedUser.role);
    } else {
        console.log('Login FAILED! Invalid username/email or password.');
    }
}

simulateLogin('admin', 'adminpassword');
