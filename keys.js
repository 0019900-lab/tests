// Smart-Analysis – قراءة المفتاح من رمزه الفيزيائي (يعمل مع أي تخطيط للوحة المفاتيح، ومنها العربي)
export const letter=e=>/^Key[A-Z]$/.test(e.code||'')?e.code[3].toLowerCase():(e.key||'').toLowerCase();
