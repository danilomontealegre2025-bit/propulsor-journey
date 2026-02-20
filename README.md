# Propulsor Journey — Universidad Externado de Colombia

**Propulsor Journey** es una plataforma de gestión académica integral diseñada para la Universidad Externado de Colombia. El sistema permite la gestión de calificaciones, evaluaciones docentes y la generación de reportes institucionales en tiempo real.

## 🚀 Características principales

- **Gestión Académica**: Control total sobre calificaciones y progreso académico de los estudiantes.
- **Roles de Usuario**: Dashboards personalizados para Estudiantes, Docentes y Administrativos.
- **Generación de Reportes**: Creación automática de PDFs institucionales para reportes de notas y evaluaciones.
- **Autenticación Basada en Excel**: Sincronización transparente con bases de datos en formato Excel (`.xlsx`).
- **Analítica**: Paneles de KPIs con estadísticas de desempeño, promedios y alertas.

## 🛠️ Tecnologías utilizadas

- **Backend**: Node.js & Express.js
- **Frontend**: HTML5, Vanilla CSS, JavaScript (ES6+)
- **Base de Datos**: Excel (vía `xlsx`)
- **Reportes**: Puppeteer para generación de PDF
- **Seguridad**: Bcrypt.js para hash de contraseñas y Express-session para gestión de sesiones.

## 📦 Instalación y Uso

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/danilomontealegre2025-bit/propulsor-journey.git
   cd propulsor-journey
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar datos**:
   Asegúrate de que el archivo `data/journey.xlsx` esté presente con la estructura requerida.

4. **Iniciar el servidor**:
   ```bash
   npm start
   ```
   O para desarrollo:
   ```bash
   npm run dev
   ```

5. **Acceder**:
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 🏛️ Contexto Institucional
Este proyecto ha sido desarrollado siguiendo los lineamientos de marca y excelencia académica de la **Universidad Externado de Colombia**.

---
© 2024 Universidad Externado de Colombia
