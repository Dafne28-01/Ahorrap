function conectarHoja() {
    const sheetId = document.getElementById('sheetId').value.trim();
    const tbody = document.getElementById('tablaMovimientos');

    if (!sheetId) {
        alert('Por favor, ingresa el ID de tu Google Sheets.');
        return;
    }

    // URL oficial de la API de Google Sheets en formato JSON
    const apiUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;

    tbody.innerHTML = `<tr><td colspan="4" class="text-center">Conectando con Google Sheets...</td></tr>`;

    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('No se pudo acceder a la hoja.');
            }
            return response.text();
        })
        .then(text => {
            // Limpiamos la respuesta que devuelve Google (viene envuelta en una función gviz)
            const jsonString = text.substring(47, text.length - 2);
            const json = JSON.parse(jsonString);
            procesarDatosJSON(json);
        })
        .catch(error => {
            console.error(error);
            tbody.innerHTML = `<tr><td colspan="4" class="text-center" style="color: #d9534f;">Error al conectar. Asegúrate de que la hoja sea pública ("Cualquier persona con el enlace").</td></tr>`;
        });
}

function procesarDatosJSON(json) {
    const tbody = document.getElementById('tablaMovimientos');
    const filas = json.table.rows;

    if (!filas || filas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center">La hoja está vacía o no tiene registros.</td></tr>`;
        return;
    }

    let totalIngresos = 0;
    let totalGastos = 0;
    let htmlTabla = '';

    // Recorremos las filas de la hoja (saltando la primera si es cabecera, o adaptándose)
    for (let i = 0; i < filas.length; i++) {
        const celdas = filas[i].c;
        
        // Verificamos que al menos existan las columnas principales
        if (celdas && celdas.length >= 4) {
            const fecha = celdas[0] ? (celdas[0].f || celdas[0].v || '') : '';
            const categoria = celdas[1] ? (celdas[1].v || '') : '';
            const medio = celdas[2] ? (celdas[2].v || '') : '';
            
            // Si es la fila de encabezados (por ejemplo dice "Fecha" o "Monto"), la saltamos
            if (i === 0 && (String(fecha).toLowerCase().includes('fecha') || String(categoria).toLowerCase().includes('categor'))) {
                continue;
            }

            const montoVal = celdas[3] ? (celdas[3].v || 0) : 0;
            const monto = parseFloat(montoVal) || 0;

            if (monto >= 0) {
                totalIngresos += monto;
            } else {
                totalGastos += Math.abs(monto);
            }

            htmlTabla += `
                <tr>
                    <td>${fecha}</td>
                    <td>${categoria}</td>
                    <td>${medio}</td>
                    <td>S/ ${monto.toFixed(2)}</td>
                </tr>
            `;
        }
    }

    tbody.innerHTML = htmlTabla || `<tr><td colspan="4" class="text-center">No se encontraron datos válidos en la hoja.</td></tr>`;

    const balance = totalIngresos - totalGastos;

    // Actualiza los indicadores del Dashboard
    document.getElementById('totalIngresos').textContent = `S/ ${totalIngresos.toFixed(2)}`;
    document.getElementById('totalGastos').textContent = `S/ ${totalGastos.toFixed(2)}`;
    document.getElementById('balanceActual').textContent = `S/ ${balance.toFixed(2)}`;
}