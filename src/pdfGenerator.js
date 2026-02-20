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

