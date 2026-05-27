function cambiarTabla() {
    let tabla = document.getElementById("tabla").value;
    document.getElementById("grupoGL").style.display = tabla === "z" ? "none" : "block";
}

function calcular() {
    let tabla = document.getElementById("tabla").value;
    let valor = parseFloat(document.getElementById("valorCalculado").value);
    let alpha = parseFloat(document.getElementById("alpha").value);
    let colas = document.getElementById("colas").value;
    let gl = parseInt(document.getElementById("gl").value);

    if (isNaN(valor)) {
        alert("Ingrese el resultado obtenido con la fórmula.");
        return;
    }

    if (tabla !== "z" && (isNaN(gl) || gl <= 0)) {
        alert("Ingrese correctamente los grados de libertad.");
        return;
    }

    let alphaBusqueda = colas === "dos" ? alpha / 2 : alpha;
    let valorTabla = 0;
    let decision = "";

    if (tabla === "z") {
        let area = normalCDF(Math.abs(valor)) - 0.5;
        valorTabla = inversaNormal(1 - alphaBusqueda);

        decision = Math.abs(valor) >= valorTabla
            ? "Se rechaza H₀"
            : "No se rechaza H₀";

        mostrarResultado(
            "Tabla Z",
            valor,
            area.toFixed(4),
            valorTabla.toFixed(4),
            alpha,
            alphaBusqueda,
            colas,
            "No aplica",
            decision,
            "En la tabla Z se busca el área entre 0 y Z. Por ejemplo, si Z = 1.25, el área aproximada es 0.3944."
        );

        dibujarNormal(valor, valorTabla, colas);
    }

    if (tabla === "t") {
        valorTabla = inversaT(1 - alphaBusqueda, gl);

        decision = Math.abs(valor) >= valorTabla
            ? "Se rechaza H₀"
            : "No se rechaza H₀";

        mostrarResultado(
            "Tabla T Student",
            valor,
            "No aplica",
            valorTabla.toFixed(4),
            alpha,
            alphaBusqueda,
            colas,
            gl,
            decision,
            "En la tabla T se busca usando los grados de libertad y el nivel de significancia."
        );

        dibujarNormal(valor, valorTabla, colas);
    }

    if (tabla === "chi") {
        valorTabla = inversaChi(1 - alphaBusqueda, gl);

        decision = valor >= valorTabla
            ? "Se rechaza H₀"
            : "No se rechaza H₀";

        mostrarResultado(
            "Tabla Chi-cuadrado",
            valor,
            "No aplica",
            valorTabla.toFixed(4),
            alpha,
            alphaBusqueda,
            colas,
            gl,
            decision,
            "En Chi-cuadrado normalmente se compara hacia la derecha de la distribución."
        );

        dibujarChi(valor, valorTabla);
    }
}

function mostrarResultado(tabla, valor, area, valorTabla, alpha, alphaBusqueda, colas, gl, decision, explicacion) {
    document.getElementById("resultado").innerHTML = `
        <h3>Resultado</h3>
        <p><strong>Tabla utilizada:</strong> ${tabla}</p>
        <p><strong>Valor calculado por el estudiante:</strong> ${valor}</p>
        <p><strong>Área encontrada en tabla:</strong> ${area}</p>
        <p><strong>Valor crítico de tabla:</strong></p>
        <p class="valor">${valorTabla}</p>
        <p><strong>Nivel de significancia α:</strong> ${alpha}</p>
        <p><strong>α usado para búsqueda:</strong> ${alphaBusqueda}</p>
        <p><strong>Colas:</strong> ${colas === "dos" ? "Dos colas" : "Una cola"}</p>
        <p><strong>Grados de libertad:</strong> ${gl}</p>
        <p class="decision">${decision}</p>
        <p><strong>Explicación:</strong> ${explicacion}</p>
    `;
}

function limpiar() {
    document.getElementById("valorCalculado").value = "";
    document.getElementById("gl").value = "";

    document.getElementById("resultado").innerHTML = `
        <h3>Resultado</h3>
        <p>Aquí aparecerá el análisis.</p>
    `;

    let canvas = document.getElementById("grafica");
    let ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

/* =========================
   FUNCIONES ESTADÍSTICAS
   ========================= */

function normalCDF(x) {
    return 0.5 * (1 + erf(x / Math.sqrt(2)));
}

function erf(x) {
    let sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    let a1 = 0.254829592;
    let a2 = -0.284496736;
    let a3 = 1.421413741;
    let a4 = -1.453152027;
    let a5 = 1.061405429;
    let p = 0.3275911;

    let t = 1 / (1 + p * x);
    let y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
}

function inversaNormal(p) {
    let min = -10;
    let max = 10;

    for (let i = 0; i < 100; i++) {
        let mid = (min + max) / 2;

        if (normalCDF(mid) < p) {
            min = mid;
        } else {
            max = mid;
        }
    }

    return (min + max) / 2;
}

function logGamma(z) {
    let g = 7;
    let p = [
        0.99999999999980993,
        676.5203681218851,
        -1259.1392167224028,
        771.32342877765313,
        -176.61502916214059,
        12.507343278686905,
        -0.13857109526572012,
        9.9843695780195716e-6,
        1.5056327351493116e-7
    ];

    if (z < 0.5) {
        return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z);
    }

    z -= 1;
    let x = p[0];

    for (let i = 1; i < p.length; i++) {
        x += p[i] / (z + i);
    }

    let t = z + g + 0.5;

    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

function betaInc(x, a, b) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;

    let bt = Math.exp(
        logGamma(a + b) - logGamma(a) - logGamma(b) +
        a * Math.log(x) + b * Math.log(1 - x)
    );

    if (x < (a + 1) / (a + b + 2)) {
        return bt * betaCF(x, a, b) / a;
    } else {
        return 1 - bt * betaCF(1 - x, b, a) / b;
    }
}

function betaCF(x, a, b) {
    let maxIter = 100;
    let eps = 1e-10;
    let fpmin = 1e-30;

    let qab = a + b;
    let qap = a + 1;
    let qam = a - 1;

    let c = 1;
    let d = 1 - qab * x / qap;

    if (Math.abs(d) < fpmin) d = fpmin;

    d = 1 / d;
    let h = d;

    for (let m = 1; m <= maxIter; m++) {
        let m2 = 2 * m;

        let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
        d = 1 + aa * d;
        if (Math.abs(d) < fpmin) d = fpmin;
        c = 1 + aa / c;
        if (Math.abs(c) < fpmin) c = fpmin;
        d = 1 / d;
        h *= d * c;

        aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
        d = 1 + aa * d;
        if (Math.abs(d) < fpmin) d = fpmin;
        c = 1 + aa / c;
        if (Math.abs(c) < fpmin) c = fpmin;
        d = 1 / d;

        let del = d * c;
        h *= del;

        if (Math.abs(del - 1) < eps) break;
    }

    return h;
}

function tCDF(t, v) {
    let x = v / (v + t * t);
    let ib = betaInc(x, v / 2, 0.5);

    if (t >= 0) {
        return 1 - 0.5 * ib;
    } else {
        return 0.5 * ib;
    }
}

function inversaT(p, gl) {
    let min = -50;
    let max = 50;

    for (let i = 0; i < 120; i++) {
        let mid = (min + max) / 2;

        if (tCDF(mid, gl) < p) {
            min = mid;
        } else {
            max = mid;
        }
    }

    return Math.abs((min + max) / 2);
}

function gammaP(a, x) {
    if (x <= 0) return 0;

    if (x < a + 1) {
        let ap = a;
        let sum = 1 / a;
        let del = sum;

        for (let n = 1; n <= 100; n++) {
            ap++;
            del *= x / ap;
            sum += del;

            if (Math.abs(del) < Math.abs(sum) * 1e-10) {
                return sum * Math.exp(-x + a * Math.log(x) - logGamma(a));
            }
        }
    } else {
        let b = x + 1 - a;
        let c = 1 / 1e-30;
        let d = 1 / b;
        let h = d;

        for (let i = 1; i <= 100; i++) {
            let an = -i * (i - a);
            b += 2;
            d = an * d + b;

            if (Math.abs(d) < 1e-30) d = 1e-30;

            c = b + an / c;

            if (Math.abs(c) < 1e-30) c = 1e-30;

            d = 1 / d;
            let del = d * c;
            h *= del;

            if (Math.abs(del - 1) < 1e-10) break;
        }

        return 1 - Math.exp(-x + a * Math.log(x) - logGamma(a)) * h;
    }

    return 0;
}

function chiCDF(x, gl) {
    return gammaP(gl / 2, x / 2);
}

function inversaChi(p, gl) {
    let min = 0;
    let max = gl;

    while (chiCDF(max, gl) < p) {
        max *= 2;
    }

    for (let i = 0; i < 120; i++) {
        let mid = (min + max) / 2;

        if (chiCDF(mid, gl) < p) {
            min = mid;
        } else {
            max = mid;
        }
    }

    return (min + max) / 2;
}

/* =========================
   GRÁFICAS
   ========================= */

function normalPDF(x) {
    return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);
}

function dibujarNormal(valor, critico, colas) {
    let canvas = document.getElementById("grafica");
    let ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let baseY = 260;
    let minX = -4;
    let maxX = 4;

    function cx(x) {
        return 50 + ((x - minX) / (maxX - minX)) * 700;
    }

    function cy(y) {
        return baseY - y * 430;
    }

    ctx.beginPath();
    ctx.moveTo(50, baseY);
    ctx.lineTo(750, baseY);
    ctx.stroke();

    ctx.beginPath();
    for (let x = minX; x <= maxX; x += 0.02) {
        let px = cx(x);
        let py = cy(normalPDF(x));

        if (x === minX) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }

    ctx.strokeStyle = "#1d3557";
    ctx.lineWidth = 3;
    ctx.stroke();

    linea(ctx, cx(valor), baseY, "red", "Calculado");
    linea(ctx, cx(critico), baseY, "blue", "Crítico");

    if (colas === "dos") {
        linea(ctx, cx(-critico), baseY, "blue", "-Crítico");
    }
}

function dibujarChi(valor, critico) {
    let canvas = document.getElementById("grafica");
    let ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.moveTo(50, 260);
    ctx.bezierCurveTo(120, 80, 250, 120, 750, 260);
    ctx.strokeStyle = "#1d3557";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(50, 260);
    ctx.lineTo(750, 260);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.stroke();

    linea(ctx, 500, 260, "blue", "Crítico");
    linea(ctx, 420, 260, "red", "Calculado");
}

function linea(ctx, x, baseY, color, texto) {
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.lineTo(x, 80);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.font = "14px Arial";
    ctx.fillText(texto, x - 30, 70);
}

cambiarTabla();
