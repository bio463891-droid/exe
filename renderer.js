const { createClient } = supabase;

// الاتصال بمشروعك الفعلي الثابت
const SUPABASE_URL = 'https://supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViYnRvdXdnY2NicW93ZGRsZ2FTIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MTE2MTUsImV4cCI6MjA5NDE4NzYxNX0.AsA9r_7Lg9UaO48Ln9SlmGkvAQYY5tOi7lATFfcEUpg';

const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const customCodeInput = document.getElementById('customCodeInput');
const btnAddCustom = document.getElementById('btnAddCustom');
const btnGenerateRandom = document.getElementById('btnGenerateRandom');
const btnRefresh = document.getElementById('btnRefresh');
const codesTableBody = document.getElementById('codesTableBody');
const globalLoader = document.getElementById('globalLoader');

// القراءة الفورية عند الإقلاع
fetchAllCodes();

async function fetchAllCodes() {
    globalLoader.style.display = 'block';
    try {
        const { data, error } = await client
            .from('secret_codes')
            .select('id, code_value, is_used, assigned_at')
            .order('id', { ascending: true });

        if (error) {
            alert('خطأ: ' + error.message);
            return;
        }

        codesTableBody.innerHTML = '';
        
        if (!data || data.length === 0) {
            codesTableBody.innerHTML = `<tr><td colspan="4" class="empty-msg">⚠️ لا توجد أكواد حالياً</td></tr>`;
            return;
        }

        data.forEach(item => {
            const tr = document.createElement('tr');
            const statusBadge = item.is_used 
                ? '<span class="badge badge-used">🔴 مأخوذ</span>' 
                : '<span class="badge badge-available">🟢 متاح</span>';

            tr.innerHTML = `
                <td>${item.id}</td>
                <td class="code-value">${item.code_value}</td>
                <td>${statusBadge}</td>
                <td class="time-text">${formatDateTime(item.assigned_at)}</td>
            `;
            codesTableBody.appendChild(tr);
        });
    } catch (err) {
        alert(err.message);
    } finally {
        globalLoader.style.display = 'none';
    }
}

btnAddCustom.addEventListener('click', async () => {
    const formatted = customCodeInput.value.trim().toUpperCase();
    if (!formatted) return;

    globalLoader.style.display = 'block';
    try {
        const { error } = await client
            .from('secret_codes')
            .insert([{ code_value: formatted, is_used: false }]);

        if (error) {
            alert(error.message);
        } else {
            customCodeInput.value = '';
            fetchAllCodes();
        }
    } catch (err) {
        alert(err.message);
    } finally {
        globalLoader.style.display = 'none';
    }
});

btnGenerateRandom.addEventListener('click', async () => {
    globalLoader.style.display = 'block';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomGenerated = '';
    for (let i = 0; i < 8; i++) {
        randomGenerated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    try {
        await client.from('secret_codes').insert([{ code_value: randomGenerated, is_used: false }]);
        fetchAllCodes();
    } catch (err) {
        alert(err.message);
    } finally {
        globalLoader.style.display = 'none';
    }
});

btnRefresh.addEventListener('click', fetchAllCodes);

// 🔒 دالة قراءة الوقت من السيرفر مباشرة وتجاهل توقيت جهاز المستخدم تماماً لمنع التزوير
function formatDateTime(isoString) {
    if (!isoString) return '—';
    const date = new Date(isoString);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    let hours = date.getUTCHours();
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'مساءً' : 'صباحاً';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${year}/${month}/${day} | ${hours}:${minutes} ${ampm} (UTC)`;
}
