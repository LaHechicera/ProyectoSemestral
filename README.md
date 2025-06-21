# 💻Proyecto Semestral🕹️

Creamos una aplicación estilo juego gráfico de deciciones, el cual está dividido en "Historias" las que decidirán el destino del usuario que juegue, al final de su recorrido aparecerá una pantalla con sus estadísticas y las deciciones tomadas durante su aventura.

---

## 📋Tabla de Contenidos

- [Descripción del proyecto](#proyecto-semestral️)
- [Integrantes](#integrantes)
- [Tecnologías](#tecnologías)
- [Instalación](#instalación)
- [Avances semanales](#avances-semanales)

---

## 🤝🏼Integrantes👩🏻‍💻👨🏻‍💻

|Nombre                             |Rol                        |
|-----------------------------------|---------------------------|
|Camila González Zúñiga             |Desarrolladora Frontend|
|Andy Villarroel Díaz               |Desarrollador Backend|

## 🛠️Tecnologías🧰

Para esto utilizaremos el framework de Electron para poder trabajar con:

- HTML y CSS (Frontend)
- JavaScript (Backend)
- MySQL Admin (Base de datos)
- Github (Control de versiones)
- API giphy (Animaciones en el inicio)
---

## 🚀Instalación🪄

Te enseñamos paso a paso para que puedas instalar el proyecto en tu propio pc:

(Antes de todo debes instalar Node.js en el caso de no tenerlo descargado)

1. Clona el repositorio:
```bash
git init
git clone https://github.com/LaHechicera/ProyectoSemestral.git
```
2. Abre la carpeta donde se encuentre el proyecto en Visual Studio Code (VSC)
3. En VSC abre la terminal con CTRL+J
4. Colocamos "npm init -y" (Este comando creara el archivo "package.json")
5. Luego insertamos "npm install electron --save-dev", esto instalara electron y la carpeta "node_modules" que contiene los paquetes para iniciar la app
6. A continuación se debe ir al archivo “package.json” y modificar como se observa a continuacion:
```bash

//Se busca esta linea de código, originalmente se ve así:

"scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
}

//Luego con la modificación en las lineas de "scripts" y "start", el archivo quedaria de la siguiente manera

{
  "name": "app",
  "version": "1.0.0",
  "main": "main.js",
  "scripts": {
    "start": "electron ." //Aqui se realiza el cambio
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "description": "",
  "devDependencies": {
    "electron": "^34.2.0"
  },
  "dependencies": {
    "mysql": "^2.18.1"
  }
}

```
7. Instalar librerias en terminal de VSC: "npm install express", "npm install cors", "npm install promise", "npm install mysql2", npm install node-fetch@2
8. Luego en la misma consola luego de realizar todos los pasos anteriores, para iniciar la app se debe ingresar "npm start"

Si los pasos fueron seguidos correctamente la aplicación se iniciaria con exito.

---

## 📈📆Avances Semanales

|Semana      |Avance       |Link      |
|------------|-------------|----------|
|📂 Semana 1 | Organización del proyecto | [Ver](https://github.com/LaHechicera/ProyectoSemestral/tree/master/Avances/Semana%201)|
|📂 Semana 2 | Inicio diseño figma | [Ver](https://github.com/LaHechicera/ProyectoSemestral/tree/master/Avances/Semana%202)|
|📂 Semana 3 | Bosquejo y prototipo | [Ver](https://github.com/LaHechicera/ProyectoSemestral/tree/master/Avances/Semana%203)|
|📂 Semana 4 | Commits y capacitación | [Ver](https://github.com/LaHechicera/ProyectoSemestral/tree/master/Avances/Semana%204)|
|📂 Semana 5 | Desarrollo proyecto (BD) | [Ver](https://github.com/LaHechicera/ProyectoSemestral/tree/master/Avances/Semana%205)|
|📂 Semana 6 | Desarrollo y planificación | [Ver](https://github.com/LaHechicera/ProyectoSemestral/tree/master/Avances/Semana%206)|
|📂 Semana 7 | Creación funciones para BD | [Ver](https://github.com/LaHechicera/ProyectoSemestral/tree/master/Avances/Semana%207)|
|📂 Semana 8 | Finalizacion con BD y API | [Ver](https://github.com/LaHechicera/ProyectoSemestral/tree/master/Avances/Semana%208)|