const puppeteer = require('puppeteer');

const EXTERNADO_GREEN = '#004b32';
const EXTERNADO_DARK = '#003624';

const FACULTAD_LOGO_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAA4QAAAByCAYAAACFp3f6AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH6AQHDA4QEDiEJgAAABh0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUOcf7IAAAEmuSURBVHic7d17fBzXfef7z6mZAcDMTDMTzAwAZiaAGZgZzMQzM5gZgJnBzMDMTDMT0EQ0E83Ec7Ecz8Rz0RxMRDORTEQzEc3Ec8Ecy0Q0EcwEcywTzURzMxHMzMwEcwB7zAwAZmZmAOYANp+9P87unm6vunvV7XbPZ/p+v16vequ66mefqjrVderU+Z2DCHGgRERERCSuREREREQiSkREREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpERZEIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpEREREIkpERZE='

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

  // Calculate global attendance
  let globalTotal = 0;
  let globalPresent = 0;

  const materiasRows = materias.map(m => {
    const total = m.fechas ? m.fechas.length : 0;
    const present = m.attendance ? (m.attendance.present || 0) : 0;
    const pct = total > 0 ? (present / total * 100) : 0;
    
    globalTotal += total;
    globalPresent += present;

    const isFailedByAttendance = total > 0 && pct < 80;
    const attStatus = isFailedByAttendance ? 'REPROBADO (FALLAS)' : (m.nota !== null ? (m.nota >= 3.0 ? 'APROBADO' : 'REPROBADO (NOTAS)') : 'PENDIENTE');
    const color = isFailedByAttendance ? '#dc2626' : notaColor(m.nota);

    return `
      <tr>
        <td>${m.materia}</td>
        <td>${m.docente}</td>
        <td style="text-align:center">${present}/${total} (${pct.toFixed(0)}%)</td>
        <td style="color:${notaColor(m.nota)};font-weight:700;text-align:center">
          ${m.nota !== null && m.nota !== undefined ? parseFloat(m.nota).toFixed(1) : 'Sin nota'}
        </td>
        <td style="text-align:center">
          <span style="background:${color};color:white;padding:2px 10px;border-radius:12px;font-size:10px;display:inline-block;min-width:100px">
            ${attStatus}
          </span>
        </td>
      </tr>
    `;
  }).join('');

  const globalAttPct = globalTotal > 0 ? ((globalPresent / globalTotal) * 100).toFixed(0) : 0;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  * { margin:0;padding:0;box-sizing:border-box; }
  body { font-family:'Helvetica', 'Arial', sans-serif;background:#fff;color:#333;padding:0; }
  .page { padding:40px; position:relative; min-height:100vh; }
  .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 25px; border-bottom: 3px solid ${EXTERNADO_GREEN}; padding-bottom: 15px; }
  .header-left { display: flex; align-items: center; }
  .logo-img { height: 75px; object-fit: contain; margin-right: 20px; }
  .header-text h1 { font-size: 24px; color: ${EXTERNADO_DARK}; margin-bottom: 2px; }
  .header-text p { font-size: 11px; color: #666; line-height: 1.3; margin: 0; }
  .report-type-container { text-align: right; }
  .report-type-title { font-size: 20px; color: ${EXTERNADO_DARK}; font-weight: bold; text-transform: uppercase; }
  .project-label { font-size: 11px; color: #999; font-style: italic; }
  
  .report-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; background: #fdfdfd; padding: 10px 15px; border-radius: 8px; border: 1px solid #eee; }
  .report-title { font-size: 16px; font-weight: bold; color: ${EXTERNADO_DARK}; }
  .report-date { font-size: 11px; color: #888; }

  .student-card { background: #fff9f9; border: 1px solid #ffecec; border-left: 5px solid ${EXTERNADO_GREEN}; border-radius: 8px; padding: 20px; margin-bottom: 25px; display: flex; justify-content: space-between; }
  .student-details h2 { font-size: 20px; color: #222; margin-bottom: 8px; }
  .student-details p { font-size: 13px; color: #555; line-height: 1.5; }
  
  .kpi-row { display: flex; gap: 15px; margin-bottom: 30px; }
  .kpi-card { flex: 1; background: ${EXTERNADO_DARK}; color: white; padding: 15px; border-radius: 8px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
  .kpi-val { font-size: 28px; font-weight: bold; margin-bottom: 5px; }
  .kpi-lbl { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9; font-weight: 600; }

  table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
  th { background: ${EXTERNADO_GREEN}; color: white; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; }
  td { padding: 12px; border-bottom: 1px solid #eee; font-size: 12px; vertical-align: middle; }
  tr:nth-child(even) td { background: #fcfcfc; }
  
  .status-info { font-size: 10px; color: #777; font-style: italic; margin-bottom: 30px; border: 1px dashed #ccc; padding: 10px; border-radius: 4px; }

  .footer { border-top: 1px solid #eee; padding-top: 20px; font-size: 10px; color: #999; text-align: center; position: absolute; bottom: 40px; left: 40px; right: 40px; }
  .signature-area { margin-top: 50px; display: flex; justify-content: flex-end; }
  .signature-line { border-top: 1px solid #333; width: 220px; text-align: center; padding-top: 8px; font-size: 12px; color: ${EXTERNADO_DARK}; font-weight: bold; }
</style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="header-left">
        <img src="${FACULTAD_LOGO_BASE64}" class="logo-img" alt="Logo Facultad">
        <div class="header-text">
          <h1>Universidad Externado de Colombia</h1>
          <p>Facultad de Administración de Empresas Turísticas y Hoteleras</p>
          <p>Journey Experience Education Design</p>
        </div>
      </div>
      <div class="report-type-container">
        <div class="report-type-title">Reporte Académico</div>
        <div class="project-label">Propulsor Journey</div>
      </div>
    </div>

    <div class="report-info">
      <div class="report-title">Historial de Calificaciones</div>
      <div class="report-date">Generado el: ${fecha}</div>
    </div>

    <div class="student-card">
      <div class="student-details">
        <h2>${nombre}</h2>
        <p><strong>Programa:</strong> ${programa}</p>
        <p><strong>Institución:</strong> Universidad Externado de Colombia</p>
      </div>
    </div>

    <div class="kpi-row">
      <div class="kpi-card"><div class="kpi-val">${promedio || 'N/A'}</div><div class="kpi-lbl">Promedio General</div></div>
      <div class="kpi-card"><div class="kpi-val">${globalPresent}/${globalTotal}</div><div class="kpi-lbl">Horas Asistidas / Total</div></div>
      <div class="kpi-card"><div class="kpi-val">${globalAttPct}%</div><div class="kpi-lbl">% Asistencia Global</div></div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Materia / Módulo</th>
          <th>Docente</th>
          <th style="text-align:center">Asistencia</th>
          <th style="text-align:center">Nota</th>
          <th style="text-align:center">Resultado</th>
        </tr>
      </thead>
      <tbody>${materiasRows}</tbody>
    </table>

    <div class="status-info">
      * Nota mínima aprobatoria: 3.0. Requisito de asistencia: mínimo 80%. Si la asistencia es inferior al 80%, la materia se considera reprobada por fallas independientemente de la nota académica.
    </div>

    <div class="signature-area">
      <div class="signature-line">Secretaría Académica — Propulsor Journey</div>
    </div>

    <div class="footer">
      <p>Facultad de Administración de Empresas Turísticas y Hoteleras · Universidad Externado de Colombia</p>
      <p>Calle 12 No. 1-17 Este, Bogotá D.C. · www.uexternado.edu.co</p>
    </div>
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
  body { font-family:'Helvetica', 'Arial', sans-serif;background:#fff;color:#333;padding:0; }
  .page { padding:40px; position:relative; min-height:100vh; }
  .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 25px; border-bottom: 3px solid ${EXTERNADO_GREEN}; padding-bottom: 15px; }
  .header-left { display: flex; align-items: center; }
  .logo-img { height: 75px; object-fit: contain; margin-right: 20px; }
  .header-text h1 { font-size: 24px; color: ${EXTERNADO_DARK}; margin-bottom: 2px; }
  .header-text p { font-size: 11px; color: #666; line-height: 1.3; margin: 0; }
  .report-type-container { text-align: right; }
  .report-type-title { font-size: 20px; color: ${EXTERNADO_DARK}; font-weight: bold; text-transform: uppercase; }
  .project-label { font-size: 11px; color: #999; font-style: italic; }
  
  .report-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; background: #fdfdfd; padding: 10px 15px; border-radius: 8px; border: 1px solid #eee; }
  .report-title { font-size: 16px; font-weight: bold; color: ${EXTERNADO_DARK}; }
  
  .info-box { background:#f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin-bottom: 30px; }
  .kpi-row { display:flex;gap:15px;margin-bottom:30px; }
  .kpi { flex:1;background:${EXTERNADO_DARK};color:white;padding:16px;border-radius:10px;text-align:center; }
  .kpi .val { font-size:32px;font-weight:bold; }
  .kpi .lbl { font-size:11px;opacity:0.85;margin-top:4px;text-transform:uppercase; font-weight: 600; }
  h3 { color:${EXTERNADO_DARK};margin-bottom:16px;font-size:15px;text-transform:uppercase; border-bottom: 1px solid #eee; padding-bottom: 5px; }
  .footer { border-top:1px solid #eee;padding-top:16px;font-size:10px;color:#999;text-align:center;position:absolute; bottom:40px; left:40px; right:40px; }
</style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="header-left">
        <img src="${FACULTAD_LOGO_BASE64}" class="logo-img" alt="Logo Facultad">
        <div class="header-text">
          <h1>Universidad Externado de Colombia</h1>
          <p>Facultad de Administración de Empresas Turísticas y Hoteleras</p>
          <p>Journey Experience Education Design</p>
        </div>
      </div>
      <div class="report-type-container">
        <div class="report-type-title">Evaluación Docente</div>
        <div class="project-label">Propulsor Journey</div>
      </div>
    </div>

    <div class="report-info">
      <div class="report-title">Informe de Evaluación Docente</div>
      <div class="report-date" style="font-size:11px;color:#666">Generado el: ${fecha}</div>
    </div>

    <div class="info-box">
      <h2 style="font-size:18px;color:#222">${nombre}</h2>
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
  body { font-family:'Helvetica', 'Arial', sans-serif;background:#fff;color:#333;padding:0; }
  .page { padding:40px; position:relative; min-height:100vh; }
  .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 25px; border-bottom: 3px solid ${EXTERNADO_GREEN}; padding-bottom: 15px; }
  .header-left { display: flex; align-items: center; }
  .logo-img { height: 75px; object-fit: contain; margin-right: 20px; }
  .header-text h1 { font-size: 24px; color: ${EXTERNADO_DARK}; margin-bottom: 2px; }
  .header-text p { font-size: 11px; color: #666; line-height: 1.3; margin: 0; }
  .report-type-container { text-align: right; }
  .report-type-title { font-size: 20px; color: ${EXTERNADO_DARK}; font-weight: bold; text-transform: uppercase; }
  .project-label { font-size: 11px; color: #999; font-style: italic; }
  
  .report-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; background: #fdfdfd; padding: 10px 15px; border-radius: 8px; border: 1px solid #eee; }
  .report-title { font-size: 16px; font-weight: bold; color: ${EXTERNADO_DARK}; }
  
  .kpi-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin-bottom:30px; }
  .kpi { background:${EXTERNADO_DARK};color:white;padding:18px;border-radius:10px;text-align:center; }
  .kpi .val { font-size:28px;font-weight:bold; }
  .kpi .lbl { font-size:10px;opacity:0.85;margin-top:4px;text-transform:uppercase; font-weight: 600; }
  h3 { color:${EXTERNADO_DARK};margin-bottom:14px;font-size:15px;margin-top:24px;text-transform:uppercase; border-bottom: 1px solid #eee; padding-bottom: 5px; }
  table { width:100%;border-collapse:collapse;margin-bottom:20px; }
  th { background:${EXTERNADO_GREEN};color:white;padding:10px 14px;text-align:left;font-size:12px;text-transform:uppercase; }
  td { padding:9px 14px;border-bottom:1px solid #eee;font-size:12px; }
  tr:nth-child(even) td { background:#fafafa; }
  .highlight { background:#f8f9fa;border-left:4px solid ${EXTERNADO_GREEN};padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:12px;font-size:12px; }
  .footer { border-top:1px solid #eee;padding-top:16px;font-size:10px;color:#999;text-align:center;position:absolute; bottom:40px; left:40px; right:40px; }
</style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="header-left">
        <img src="${FACULTAD_LOGO_BASE64}" class="logo-img" alt="Logo Facultad">
        <div class="header-text">
          <h1>Universidad Externado de Colombia</h1>
          <p>Facultad de Administración de Empresas Turísticas y Hoteleras</p>
          <p>Journey Experience Education Design</p>
        </div>
      </div>
      <div class="report-type-container">
        <div class="report-type-title">Informe General</div>
        <div class="project-label">Propulsor Journey</div>
      </div>
    </div>

    <div class="report-info">
      <div class="report-title">Informe General Estadístico</div>
      <div class="report-date" style="font-size:11px;color:#666">Generado el: ${fecha}</div>
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
  console.log('--- Iniciando generación de PDF ---');
  console.log('Lanzando Puppeteer con path:', process.env.PUPPETEER_EXECUTABLE_PATH);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null
    });

    console.log('Navegador lanzado correctamente');
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle2' });
    console.log('Contenido HTML cargado');

    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      printBackground: true
    });

    console.log('PDF generado exitosamente');
    return pdf;
  } catch (err) {
    console.error('--- ERROR GENERANDO PDF ---');
    console.error(err);
    throw err;
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = { generateStudentPDF, generateTeacherEvaluationPDF, generateAdminReportPDF };
