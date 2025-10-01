En esta aplicación web permite reconocer números manuscritos usando una red neuronal en la nube.
El usuario sube una imagen de un dígito (28×28 px), la aplicación la procesa y envía a la API, que devuelve la predicción del número, su precisión y el tiempo de respuesta.


--Instrucciones para instalar dependencias para la correcta ejecucion del Programa
1. Primero asegurate de tener node.js en tu PC (Incluye npm)

>En la terminal de tu portatil (Bash o cmd), para verificar si esta instalado, de lo contrario descargalo a traves de la pagina de node.js
```ruby
node -v
npm -v
```
2. Crea un proyecto con Vite
En la terminal de VS Code (o CMD en la carpeta donde quieres el proyecto)
```ruby
npm create vite@latest nombre-proyecto
```
En ese mismo codigo te dara a elegir el framework, en este caso Escogeremos react y lenguaje Typescript, despues, te dara a escoger si quieres la herramienta "Rolldown", en este caso diremos que no.

3. Ahora entra a la Carpeta de tu proyecto ,instala npm y correlo
```ruby
cd mi-proyecto
npm install
npm run dev
```
4.Como Abro la Carpeta de mi Proyecto?
>Facil desde CMD
```ruby 
cd mi-proyecto
code .
```
Por defecto abrira Visual Code studio con la carpeta de tu proyecto

5. Dentro de la carpeta del proyecto, debes instalar una Libreria de react para el correcto funcionamiento de la app web
```ruby 
npm install react-router-dom
```
