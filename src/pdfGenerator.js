const puppeteer = require('puppeteer');

const EXTERNADO_RED = '#8B0000';
const EXTERNADO_DARK = '#5a0000';

function calcPromedio(materias) {
    const withNotes = materias.filter(m => m.nota !== null && m.nota !== undefined && !isNaN(m.nota));
    if (!withNotes.length) return null;
    return (withNotes.reduce((s, m) => s + parseFloat(m.nota), 0) / withNotes.length).toFixed(2);
}

function notaColor(nota) {
    if (nota === null || nota === undefined) return '#888';
    if (nota < 3.0) return '#dc2626';
    if (nota < 3.5) return '#f59e0b';
    return '#16a34a';
}

async function generateStudentPDF(studentData) {
    const { nombre, programa, materias } = studentData;
    const promedio = calcPromedio(materias);
    const fecha = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });

    const materiasRows = materias.map(m => `
    <tr>
      <td>${m.materia}</td>
      <td>${m.docente}</td>
      <td style="color:${notaColor(m.nota)};font-weight:700;text-align:center">
        ${m.nota !== null && m.nota !== undefined ? parseFloat(m.nota).toFixed(1) : 'Sin nota'}
      </td>
      <td style="text-align:center">
        <span style="background:${notaColor(m.nota)};color:white;padding:2px 10px;border-radius:12px;font-size:11px">
          ${m.nota >= 3.0 ? 'APROBADO' : m.nota !== null ? 'REPROBADO' : 'PENDIENTE'}
        </span>
      </td>
    </tr>
  `).join('');

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Georgia', serif; background: #fff; color: #222; padding: 40px; }
  .header { display: flex; align-items: center; border-bottom: 3px solid ${EXTERNADO_RED}; padding-bottom: 20px; margin-bottom: 30px; }
  .logo-area { flex: 1; }
  .logo-text { font-size: 28px; font-weight: bold; color: ${EXTERNADO_RED}; line-height: 1.2; }
  .logo-sub { font-size: 13px; color: #555; margin-top: 4px; }
  .doc-title { text-align: right; }
  .doc-title h1 { font-size: 18px; color: ${EXTERNADO_RED}; }
  .doc-title p { font-size: 12px; color: #666; margin-top: 4px; }
  .student-info { background: #f9f0f0; border-left: 4px solid ${EXTERNADO_RED}; padding: 16px 20px; margin-bottom: 28px; border-radius: 0 8px 8px 0; }
  .student-info h2 { font-size: 20px; color: ${EXTERNADO_DARK}; }
  .student-info p { font-size: 13px; color: #555; margin-top: 6px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
  th { background: ${EXTERNADO_RED}; color: white; padding: 12px 14px; text-align: left; font-size: 13px; }
  td { padding: 10px 14px; border-bottom: 1px solid #eee; font-size: 13px; }
  tr:nth-child(even) td { background: #fafafa; }
  .promedio-box { background: ${EXTERNADO_RED}; color: white; padding: 20px 28px; border-radius: 10px; display: inline-block; margin-bottom: 28px; }
  .promedio-box .label { font-size: 13px; opacity: 0.85; }
  .promedio-box .value { font-size: 36px; font-weight: bold; }
  .footer { border-top: 1px solid #ddd; padding-top: 16px; font-size: 11px; color: #888; text-align: center; }
  .seal { text-align: right; margin-top: 40px; }
  .seal-line { border-top: 1px solid #aaa; display: inline-block; width: 200px; padding-top: 8px; font-size: 12px; color: #555; }
</style>
</head>
<body>
  <div class="header">
    <div class="logo-area">
      <div class="logo-text">Universidad<br>Externado<br><span style="font-size:18px">de Colombia</span></div>
      <div class="logo-sub">Fundada en 1886 · Bogotá, Colombia</div>
    </div>
    <div class="doc-title">
      <h1>REPORTE ACADÉMICO</h1>
      <p>Documento oficial de calificaciones</p>
      <p style="margin-top:8px;color:${EXTERNADO_RED};font-weight:bold">Propulsor Journey</p>
    </div>
  </div>

  <div class="student-info">
    <h2>${nombre}</h2>
    <p><strong>Programa:</strong> ${programa}</p>
    <p><strong>Fecha de generación:</strong> ${fecha}</p>
  </div>

  <h3 style="color:${EXTERNADO_RED};margin-bottom:14px;font-size:15px">REGISTRO DE CALIFICACIONES</h3>
  <table>
    <thead>
      <tr><th>Materia</th><th>Docente</th><th style="text-align:center">Nota</th><th style="text-align:center">Estado</th></tr>
    </thead>
    <tbody>${materiasRows}</tbody>
  </table>

  <div class="promedio-box">
    <div class="label">PROMEDIO GENERAL</div>
    <div class="value">${promedio || 'N/A'}</div>
    <div class="label" style="margin-top:4px">${promedio >= 3.0 ? '✓ Rendimiento Satisfactorio' : promedio ? '⚠ Requiere Atención' : ''}</div>
  </div>

  <div class="seal">
    <div class="seal-line">Registro Académico Oficial</div>
  </div>

  <div class="footer">
    <p>Universidad Externado de Colombia · Calle 12 No. 1-17 Este, Bogotá D.C. · www.uexternado.edu.co</p>
    <p style="margin-top:4px">Este documento es generado automáticamente por el sistema Propulsor Journey</p>
  </div>
</body>
</html>`;

    return await htmlToPDF(html);
}

async function generateTeacherEvaluationPDF(teacherData, evaluations, questions) {
    const { nombre, programas } = teacherData;
    const fecha = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
    const totalEvals = evaluations.length;

    // Calculate averages per question
    const questionAverages = questions.map(q => {
        const answers = evaluations.map(e => {
            const ans = e.answers.find(a => a.questionId == q.id);
            return ans ? parseFloat(ans.value) : null;
        }).filter(v => v !== null);
        const avg = answers.length ? (answers.reduce((s, v) => s + v, 0) / answers.length).toFixed(2) : 'N/A';
        return { pregunta: q.pregunta, avg, count: answers.length };
    });

    const overallAvg = questionAverages.filter(q => q.avg !== 'N/A').length
        ? (questionAverages.filter(q => q.avg !== 'N/A').reduce((s, q) => s + parseFloat(q.avg), 0) / questionAverages.filter(q => q.avg !== 'N/A').length).toFixed(2)
        : 'N/A';

    const barsHtml = questionAverages.map((q, i) => {
        const pct = q.avg !== 'N/A' ? (parseFloat(q.avg) / 5 * 100).toFixed(0) : 0;
        const color = parseFloat(q.avg) >= 4 ? '#16a34a' : parseFloat(q.avg) >= 3 ? '#f59e0b' : '#dc2626';
        return `
      <div style="margin-bottom:14px">
        <div style="font-size:12px;color:#444;margin-bottom:4px">${i + 1}. ${q.pregunta}</div>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="flex:1;background:#eee;border-radius:6px;height:20px;overflow:hidden">
            <div style="width:${pct}%;background:${color};height:100%;border-radius:6px;transition:width 0.3s"></div>
          </div>
          <span style="font-weight:bold;color:${color};min-width:35px;font-size:13px">${q.avg}</span>
        </div>
      </div>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8">
<style>
  * { margin:0;padding:0;box-sizing:border-box; }
  body { font-family:'Georgia',serif;background:#fff;color:#222;padding:40px; }
  .header { display:flex;align-items:center;border-bottom:3px solid ${EXTERNADO_RED};padding-bottom:20px;margin-bottom:30px; }
  .logo-text { font-size:26px;font-weight:bold;color:${EXTERNADO_RED};line-height:1.2; }
  .logo-sub { font-size:12px;color:#555;margin-top:4px; }
  .doc-title { text-align:right;flex:1; }
  .doc-title h1 { font-size:17px;color:${EXTERNADO_RED}; }
  .info-box { background:#f9f0f0;border-left:4px solid ${EXTERNADO_RED};padding:16px 20px;margin-bottom:28px;border-radius:0 8px 8px 0; }
  .kpi-row { display:flex;gap:16px;margin-bottom:28px; }
  .kpi { flex:1;background:${EXTERNADO_RED};color:white;padding:16px;border-radius:10px;text-align:center; }
  .kpi .val { font-size:32px;font-weight:bold; }
  .kpi .lbl { font-size:11px;opacity:0.85;margin-top:4px; }
  h3 { color:${EXTERNADO_RED};margin-bottom:16px;font-size:15px; }
  .footer { border-top:1px solid #ddd;padding-top:16px;font-size:11px;color:#888;text-align:center;margin-top:30px; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo-text">Universidad<br>Externado<br><span style="font-size:17px">de Colombia</span></div>
      <div class="logo-sub">Fundada en 1886 · Bogotá, Colombia</div>
    </div>
    <div class="doc-title">
      <h1>INFORME DE EVALUACIÓN DOCENTE</h1>
      <p style="font-size:12px;color:#666">Propulsor Journey · ${fecha}</p>
    </div>
  </div>

  <div class="info-box">
    <h2 style="font-size:18px;color:${EXTERNADO_DARK}">${nombre}</h2>
    <p style="font-size:13px;color:#555;margin-top:6px"><strong>Programas:</strong> ${programas.join(', ')}</p>
  </div>

  <div class="kpi-row">
    <div class="kpi"><div class="val">${totalEvals}</div><div class="lbl">Estudiantes que evaluaron</div></div>
    <div class="kpi"><div class="val">${overallAvg}</div><div class="lbl">Promedio general</div></div>
    <div class="kpi"><div class="val">${questions.length}</div><div class="lbl">Criterios evaluados</div></div>
  </div>

  <h3>RESULTADOS POR CRITERIO (Escala 1–5)</h3>
  ${totalEvals > 0 ? barsHtml : '<p style="color:#888;font-style:italic">No hay evaluaciones registradas aún.</p>'}

  <div class="footer">
    <p>Universidad Externado de Colombia · Sistema Propulsor Journey</p>
    <p style="margin-top:4px">Documento generado el ${fecha}</p>
  </div>
</body>
</html>`;

    return await htmlToPDF(html);
}

async function generateAdminReportPDF(stats) {
    const fecha = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });

    const programRows = Object.entries(stats.byProgram).map(([prog, d]) => `
    <tr>
      <td>${prog}</td>
      <td style="text-align:center">${d.count}</td>
      <td style="text-align:center;font-weight:bold;color:${notaColor(d.avg)}">${d.avg || 'N/A'}</td>
    </tr>
  `).join('');

    const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8">
<style>
  * { margin:0;padding:0;box-sizing:border-box; }
  body { font-family:'Georgia',serif;background:#fff;color:#222;padding:40px; }
  .header { display:flex;align-items:center;border-bottom:3px solid ${EXTERNADO_RED};padding-bottom:20px;margin-bottom:30px; }
  .logo-text { font-size:26px;font-weight:bold;color:${EXTERNADO_RED};line-height:1.2; }
  .logo-sub { font-size:12px;color:#555;margin-top:4px; }
  .doc-title { text-align:right;flex:1; }
  .kpi-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:30px; }
  .kpi { background:${EXTERNADO_RED};color:white;padding:18px;border-radius:10px;text-align:center; }
  .kpi .val { font-size:30px;font-weight:bold; }
  .kpi .lbl { font-size:11px;opacity:0.85;margin-top:4px; }
  h3 { color:${EXTERNADO_RED};margin-bottom:14px;font-size:15px;margin-top:24px; }
  table { width:100%;border-collapse:collapse;margin-bottom:20px; }
  th { background:${EXTERNADO_RED};color:white;padding:10px 14px;text-align:left;font-size:13px; }
  td { padding:9px 14px;border-bottom:1px solid #eee;font-size:13px; }
  tr:nth-child(even) td { background:#fafafa; }
  .highlight { background:#f9f0f0;border-left:4px solid ${EXTERNADO_RED};padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:12px; }
  .footer { border-top:1px solid #ddd;padding-top:16px;font-size:11px;color:#888;text-align:center;margin-top:30px; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo-text">Universidad<br>Externado<br><span style="font-size:17px">de Colombia</span></div>
      <div class="logo-sub">Fundada en 1886 · Bogotá, Colombia</div>
    </div>
    <div class="doc-title">
      <h1 style="font-size:17px;color:${EXTERNADO_RED}">INFORME GENERAL ESTADÍSTICO</h1>
      <p style="font-size:12px;color:#666">Propulsor Journey · ${fecha}</p>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi"><div class="val">${stats.totalStudents}</div><div class="lbl">Total Estudiantes</div></div>
    <div class="kpi"><div class="val">${stats.totalTeachers}</div><div class="lbl">Total Docentes</div></div>
    <div class="kpi"><div class="val">${stats.totalPrograms}</div><div class="lbl">Programas Activos</div></div>
    <div class="kpi"><div class="val">${stats.overallAvg || 'N/A'}</div><div class="lbl">Promedio General</div></div>
    <div class="kpi"><div class="val">${stats.totalEvaluations}</div><div class="lbl">Evaluaciones Docentes</div></div>
    <div class="kpi"><div class="val">${stats.passRate}%</div><div class="lbl">Tasa de Aprobación</div></div>
  </div>

  <h3>ESTUDIANTES POR PROGRAMA</h3>
  <table>
    <thead><tr><th>Programa</th><th style="text-align:center">Estudiantes</th><th style="text-align:center">Promedio</th></tr></thead>
    <tbody>${programRows}</tbody>
  </table>

  ${stats.bestSubject ? `<div class="highlight"><strong>📈 Materia con mejor promedio:</strong> ${stats.bestSubject.name} (${stats.bestSubject.avg})</div>` : ''}
  ${stats.worstSubject ? `<div class="highlight"><strong>📉 Materia con menor promedio:</strong> ${stats.worstSubject.name} (${stats.worstSubject.avg})</div>` : ''}
  ${stats.bestTeacher ? `<div class="highlight"><strong>⭐ Docente mejor evaluado:</strong> ${stats.bestTeacher.name} (${stats.bestTeacher.avg}/5)</div>` : ''}

  <div class="footer">
    <p>Universidad Externado de Colombia · Sistema Propulsor Journey</p>
    <p style="margin-top:4px">Informe generado el ${fecha} · Documento confidencial de uso institucional</p>
  </div>
</body>
</html>`;

    return await htmlToPDF(html);
}

async function htmlToPDF(html) {
        const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 
            process.env.PUPPETEER_EXECUTABLE_PATH || null,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
        format: 'A4',
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        printBackground: true
    });
    await browser.close();
    return pdf;
}

module.exports = { generateStudentPDF, generateTeacherEvaluationPDF, generateAdminReportPDF };
