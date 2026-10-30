// StatLab – اللغة والمصطلحات | Language & terminology
// T(ar,en) يرجّع النص حسب لغة الواجهة الحالية. آمن للاستخدام داخل Node.
export const lang=()=>globalThis.document?.documentElement?.lang==='en'?'en':'ar';
export const T=(ar,en)=>lang()==='ar'?ar:(en??ar);
// قاموس المصطلحات الموحّد: [عربي، English، شرح مبسّط عربي، plain English]
// ملاحظة: نتائج التحاليل بتفضل بمصطلحات SPSS الإنجليزية (معيار النشر العلمي)، والواجهة بتعرض الاثنين.
export const GLOSSARY=[
['متغير','Variable','عمود في الجدول يمثّل خاصية تُقاس، مثل العمر أو الجنس.','A column that holds one measured attribute.'],
['حالة','Case','صفّ واحد في الجدول، ويمثّل فرداً أو مشاهدة.','One row: a person or observation.'],
['قيمة مفقودة','Missing value','خلية فارغة أو قيمة معرَّفة بأنها «غير متاحة»، وتُستبعد من الحساب.','An empty or flagged value excluded from calculations.'],
['تسمية القيمة','Value label','نص يشرح رمزاً رقمياً، مثل 1 = ذكر.','Text that explains a numeric code, e.g. 1 = Male.'],
['مستوى القياس','Measure','اسمي (Nominal) أو رتبي (Ordinal) أو كمّي (Scale).','Nominal, Ordinal or Scale.'],
['المتوسط الحسابي','Mean','مجموع القيم مقسوماً على عددها.','Sum of values divided by their count.'],
['الوسيط','Median','القيمة التي تقع في منتصف القيم بعد ترتيبها.','The middle value when sorted.'],
['المنوال','Mode','القيمة الأكثر تكراراً.','The most frequent value.'],
['الانحراف المعياري','Std. Deviation','مقياس لتشتّت القيم حول المتوسط.','How spread out values are around the mean.'],
['التباين','Variance','مربّع الانحراف المعياري.','The squared standard deviation.'],
['الخطأ المعياري','Std. Error','مقدار عدم الدقة في تقدير إحصائية مثل المتوسط.','Uncertainty of an estimate such as the mean.'],
['الالتواء','Skewness','مدى عدم تماثل التوزيع.','Asymmetry of a distribution.'],
['التفلطح','Kurtosis','مدى حدّة قمّة التوزيع وسُمك ذيوله.','Peakedness and tail weight.'],
['الدلالة الإحصائية','Sig. (p-value)','احتمال الحصول على هذه النتيجة بمحض الصدفة؛ إذا كان أقل من 0.05 عُدّت النتيجة دالّة.','Chance of such a result under no effect; < .05 is significant.'],
['درجات الحرية','df','عدد القيم التي يمكن أن تتغيّر بحرية في الحساب.','Number of values free to vary.'],
['فترة الثقة 95%','95% CI','المدى الذي يُرجَّح أن يحتوي القيمة الحقيقية.','Range likely to contain the true value.'],
['حجم الأثر','Effect size','قوة الفرق أو العلاقة بصرف النظر عن حجم العينة.','Strength of an effect regardless of sample size.'],
['اختبار T','T Test','مقارنة بين متوسطين.','Compares two means.'],
['تحليل التباين','ANOVA','مقارنة متوسطات ثلاث مجموعات أو أكثر.','Compares means of 3+ groups.'],
['الارتباط','Correlation','قوة العلاقة بين متغيرين واتجاهها.','Strength and direction of a relationship.'],
['جدول تقاطعي','Crosstab','جدول تكرارات لمتغيرين فئويين.','Frequency table for two categorical variables.'],
['مربع كاي','Chi-square','اختبار لاستقلال متغيرين فئويين.','Tests independence of categorical variables.'],
['المخرجات','Output','نافذة النتائج (جداول وملاحظات).','The results window.'],
['عرض البيانات','Data View','شبكة البيانات التي تُدخل فيها القيم.','The data grid.'],
['عرض المتغيرات','Variable View','جدول لتعريف خصائص المتغيرات.','Where variables are defined.']];
