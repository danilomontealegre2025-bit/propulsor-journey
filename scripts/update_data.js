const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const wb = XLSX.utils.book_new();

// --- Students Data ---
const studentsData = [
    ["Usuario", "Contraseña", "Estudiante", "Programa asignado", "Código programa", "Correo"],
    ["39789871", "Est1Al", "Alda Salomé Grajales Lemos", "Diplomado en Analítica de Negocios de Alojamiento", "DIo1", "salome.grajales@gmail.com"],
    ["1024527737", "Est2Al", "Alberto Vargas Azuaje", "Diplomado en Analítica de Negocios de Alojamiento", "DIo1", "alberto.vargas@thesomos.com"],
    ["16932775", "Est3An", "Andrés Felipe Vallejo Mosquera", "Diplomado en Analítica de Negocios de Alojamiento", "DIo1", "avallejo@metro-op.com"],
    ["1151950133", "Est4Ay", "Aylén Alejandra Pérez Cortes", "Diplomado en Analítica de Negocios de Alojamiento", "DIo1", "financiero.hamptoncali@metro-op.com"],
    ["1000383477", "Est5Ca", "Camila Andrea Cárdenas Lara", "Diplomado en Analítica de Negocios de Alojamiento", "DIo1", "ccardenas@cotelco.org"],
    ["1128452793", "Est6Di", "Diana Cecilia Castañeda Maya", "Diplomado en Analítica de Negocios de Alojamiento", "DIo1", "d.castanedamaya@gmail.com"],
    ["1047496837", "Est7Di", "Diana Marcela Campos Bueno", "Diplomado en Analítica de Negocios de Alojamiento", "DIo1", "Diadeana15@hotmail.com"],
    ["93414546", "Est8Di", "Diego Alejandro Grajales Conde", "Diplomado en Analítica de Negocios de Alojamiento", "DIo1", "lider.financiero@vivamosdelosbienesraices.com"],
    ["71352123", "Est9Ed", "Edilberto Serrano Varilla", "Diplomado en Analítica de Negocios de Alojamiento", "DIo1", "edilberto.serrano@lagoonhotel.com"],
    ["73581860", "Est10Ed", "Eduardo Velasquez Campo", "Diplomado en Analítica de Negocios de Alojamiento", "DIo1", "eduardo.velasquez@lagoonhotel.com"],
    ["79986486", "Est11Ge", "Gerardo Alberto Urrea Herrera", "Diplomado en Analítica de Negocios de Alojamiento", "DIo1", "REVENUE@SELVARIO36HOTEL.COM"],
    ["1002314099", "Est12He", "Hernán Ricardo Carranza Montenegro", "Diplomado en Analítica de Negocios de Alojamiento", "DIo1", "hernancarranza560@gmail.com"],
    ["96352560", "Est13Hu", "Humberto Sánchez Cedeño", "Diplomado en Analítica de Negocios de Alojamiento", "DIo1", "humberto.sanchez01@est.uexternado.edu.co"],
    ["15512508", "Est14Ja", "Jaime Toro Castillo", "Diplomado en Analítica de Negocios de Alojamiento", "DIo1", "gerencia@cafehotel.com.co"],
    ["73155986", "Est15Jo", "Jorge Miguel Najera Guerrero", "Diplomado en Analítica de Negocios de Alojamiento", "DIo1", "Contralorgeneral@santosdepiedra.com.co"],
    ["1032438159", "Est16Ju", "Juan Camilo Lovera Peña", "Diplomado en Analítica de Negocios de Alojamiento", "DIo1", "gerencia@vivamosdelosbienesraices.com"],
    ["1022366232", "Est17Ju", "Juan David Morales Corredor", "Diplomado en Analítica de Negocios de Alojamiento", "DIo1", "REVENUE@V-GRANDHOTELS.COM"],
    ["1144087674", "Est18Ju", "Juan Felipe Salgado", "Diplomado en Analítica de Negocios de Alojamiento", "DIo1", "biosalgology2@gmail.com"],
    ["1039448085", "Est19Ju", "Juanita Escobar Vélez", "Diplomado en Analítica de Negocios de Alojamiento", "DIo1", "juanita.escobar@eehoteles.com"],
    ["1047444463", "Est20La", "Laura Alexandra Cuello Carbonell", "Diplomado en Analítica de Negocios de Alojamiento", "DIo1", "cartagena.apartments1@gmail.com"],
    ["34325204", "Est21Le", "Leydi Viviana Rivera Bastidas", "Diplomado en Analítica de Negocios de Alojamiento", "DIo1", "Dadministrativo.cali@azorhoteles.com"],
    ["1047421156", "Est22Lu", "Luis Alberto Ricaurte Barón", "Diplomado en Analítica de Negocios de Alojamiento", "DIo1", "Lricaurte@doradoplaza.com"],
    ["1083002984", "Est23Ma", "María Alejandra Linero Quintana", "Diplomado en Analítica de Negocios de Alojamiento", "DIo1", "Analista.datos@zuana.com.co"],
    ["42074897", "Est24Ma", "María Cecilia Jiménez", "Diplomado en Analítica de Negocios de Alojamiento", "DIo1", "maria.jimenez@hotmail.com"],
    ["45555715", "Est25Ma", "María Ines Osorio Diaz", "Diplomado en Analítica de Negocios de Alojamiento", "DIo1", "finanzas@wyndhamgardencartagena.com"],
    ["1032506029", "Est26Ma", "María Teresa Esteban", "Diplomado en Analítica de Negocios de Alojamiento", "DIo1", "mariat.esteban@habitelhotels.com"],
    ["1144194072", "Est27Na", "Natalia Echeverri Cardona", "Diplomado en Analítica de Negocios de Alojamiento", "DIo1", "Gerenciamsciudadjardin@hotelesms.com"],
    ["1006036595", "Est28Sa", "Santiago Muñoz Fajardo", "Diplomado en Analítica de Negocios de Alojamiento", "DIo1", "samufao107@gmail.com"],
    ["1144179760", "Est29St", "Stiven Hernández Romero", "Diplomado en Analítica de Negocios de Alojamiento", "DIo1", "stiven.hernandez@hilton.com"],
    ["66907448", "Est30Vi", "Viviana Castro Hoyos", "Diplomado en Analítica de Negocios de Alojamiento", "DIo1", "viviana.castro@hotelobeliscocali.com"]
];

const wsStudents = XLSX.utils.aoa_to_sheet(studentsData);
XLSX.utils.book_append_sheet(wb, wsStudents, "Estudiantes");

// --- Teachers Data ---
const teachersData = [
    ["Usuario", "Contraseña", "NOMBRE", "Código programa", "Programa asignado", "Materia", "Horas", "Fechas de clases"],
    ["Doc01", "SA&_01_TO", "Sandra Lorena Tovar", "DIo1", "Diplomado en Analítica de Negocios de Alojamiento", "Introducción a la estrategia de datos", 2, "07, 08, 09, 14, 15, 16 de abril 2026"],
    ["Doc02", "EM&_02_CA", "Emma Camargo", "DIo1", "Diplomado en Analítica de Negocios de Alojamiento", "Protección de datos", 2, "21, 22, 23, 28 de abril 2026"],
    ["Doc03", "WI&_03_ES", "William Rodrigo Escobar", "DIo1", "Diplomado en Analítica de Negocios de Alojamiento", "Inteligencia de Negocios para establecimientos de alojamiento", 2, "29, 30 de abril 2026, 05, 06, 07, 12, 13, 14, 19, 20 de mayo 2026"],
    ["Doc04", "NA&_04_AM", "Natalia Contreras Amaya", "DIo1", "Diplomado en Analítica de Negocios de Alojamiento", "Inteligencia de Negocios para establecimientos de alojamiento", 2, "21, 26, 27, 28 de mayo 2026 y 02, 03, 04, 09, 10, 11 de junio 2026"],
    ["Doc05", "JO&_05_PE", "Jonathan Andrés Pérez López", "DIo1", "Diplomado en Analítica de Negocios de Alojamiento", "Analítica de Negocios: Power Query y estadística descriptiva aplicada", 2, "16, 17, 18, 23, 24 de junio 2026"],
    ["Doc05", "JO&_05_PE", "Jonathan Andrés Pérez López", "DIo1", "Diplomado en Analítica de Negocios de Alojamiento", "Analítica de Negocios: Estadística Inferencial para decisiones comerciales", 2, "25, 30 de junio 2026 y 01 de julio 2026"],
    ["Doc07", "ED&_07_SU", "Eduárez", "DIo1", "Diplomado en Analítica de Negocios de Alojamiento", "Analítica de Negocios: Tecnología de datos en turismo", 2, "02, 07, 08, 09, 14, 15, 16 de julio 2026"],
    ["Doc08", "SA&_08_TO", "Sandra Lorena Tovar", "DIo1", "Diplomado en Analítica de Negocios de Alojamiento", "Analítica de Negocios: BI sin código: Introducción a Power BI / Looker", 2, "21, 22, 23, 28, 29, 30 de julio 2026 y 04 de agosto 2026"],
    ["Doc09", "MA&_09_SA", "Mario Sánchez", "DIo1", "Diplomado en Analítica de Negocios de Alojamiento", "Analítica de Negocios: IA como copiloto de la analítica turística", 2, "05, 06, 11, 12, 13, 18, 19, 20 de agosto 2026"]
];

const wsTeachers = XLSX.utils.aoa_to_sheet(teachersData);
XLSX.utils.book_append_sheet(wb, wsTeachers, "Docentes");

// --- Administrative Data ---
const adminData = [
    ["Usuario", "Contraseña", "NOMBRE"],
    ["Admin01", "AC_&jo*2026", "Academica Turismo"]
];

const wsAdmin = XLSX.utils.aoa_to_sheet(adminData);
XLSX.utils.book_append_sheet(wb, wsAdmin, "Administrativos");

// --- Write File ---
const excelPath = path.join(dataDir, 'journey.xlsx');
XLSX.writeFile(wb, excelPath);

console.log('✅ journey.xlsx actualizado con éxito en:', excelPath);
