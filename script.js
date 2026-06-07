let modoActual = 'texto';
let imagenCargada = null;

function cambiarModo(modo) {
    modoActual = modo;
    document.getElementById('tabTexto').classList.toggle('active', modo === 'texto');
    document.getElementById('tabImagen').classList.toggle('active', modo === 'imagen');
    document.getElementById('controlesTexto').classList.toggle('hidden', modo !== 'texto');
    document.getElementById('controlesImagen').classList.toggle('hidden', modo !== 'imagen');
    actualizarFavicon();
}

function cargarImagen(e) {
    const reader = new FileReader();
    reader.onload = function(event){
        imagenCargada = new Image();
        imagenCargada.onload = function(){
            actualizarFavicon();
        }
        imagenCargada.src = event.target.result;
    }
    if(e.target.files[0]) {
        reader.readAsDataURL(e.target.files[0]);
    }
}

function dibujarEnCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const escala = size / 512;
    
    ctx.clearRect(0, 0, size, size);
    const radius = parseInt(document.getElementById('inputRadius').value) * escala;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, radius);
    ctx.clip();

    if (modoActual === 'texto') {
        ctx.fillStyle = document.getElementById('colorBg').value;
        ctx.fillRect(0, 0, size, size);

        ctx.restore();
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(0, 0, size, size, radius);
        ctx.clip();

        const texto = document.getElementById('inputText').value || "";
        const fontStr = document.getElementById('inputFont').value;
        const fontPorcentaje = document.getElementById('inputFontSize').value;
        
        let fontSize = (size * (fontPorcentaje / 100));
        ctx.font = `bold ${fontSize}px ${fontStr}`;
        
        // SISTEMA DE ENCOGIMIENTO AUTOMÁTICO DE TEXTO
        // Si el texto mide más que el ancho disponible del canvas, reduce la fuente
        const anchoMaximoPermitido = size * 0.9; 
        let anchoTexto = ctx.measureText(texto).width;
        
        while (anchoTexto > anchoMaximoPermitido && fontSize > 1) {
            fontSize -= 2;
            ctx.font = `bold ${fontSize}px ${fontStr}`;
            anchoTexto = ctx.measureText(texto).width;
        }

        ctx.fillStyle = document.getElementById('colorText').value;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(texto, size / 2, size / 2 + (fontSize * 0.04));

    } else if (modoActual === 'imagen' && imagenCargada) {
        ctx.fillStyle = document.getElementById('colorBgImg').value;
        ctx.fillRect(0, 0, size, size);

        // IMAGEN AL 100% (Ocupa el favicon entero sin márgenes artificiales)
        let iw = imagenCargada.width;
        let ih = imagenCargada.height;
        let ratio = Math.min(size / iw, size / ih);
        
        let nw = iw * ratio;
        let nh = ih * ratio;
        let cx = (size - nw) / 2;
        let cy = (size - nh) / 2;

        if (document.getElementById('checkQuitarFondo').checked) {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = size;
            tempCanvas.height = size;
            const tCtx = tempCanvas.getContext('2d');
            tCtx.drawImage(imagenCargada, cx, cy, nw, nh);
            
            const imgData = tCtx.getImageData(0, 0, size, size);
            const data = imgData.data;
            
            for (let i = 0; i < data.length; i += 4) {
                if (data[i] > 240 && data[i+1] > 240 && data[i+2] > 240) {
                    data[i+3] = 0; 
                }
            }
            tCtx.putImageData(imgData, 0, 0);
            ctx.drawImage(tempCanvas, 0, 0);
        } else {
            ctx.drawImage(imagenCargada, cx, cy, nw, nh);
        }
    } else {
        ctx.fillStyle = "#cccccc";
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = "#666666";
        ctx.font = `${20 * escala}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText("Sube una imagen", size/2, size/2);
    }

    ctx.restore();
}

function actualizarFavicon() {
    const mainCanvas = document.getElementById('previewCanvas');
    dibujarEnCanvas(mainCanvas);
}

// FUNCIÓN PARA COPIAR AL PORTAPAPELES SIN COMENTARIOS
function copiarCodigo() {
    const codigoElemento = document.getElementById('htmlCode');
    const boton = document.querySelector('.btn-copy');
    
    // Convertir entidades HTML como &lt; y &gt; a texto plano para copiar bien
    const textarea = document.createElement('textarea');
    textarea.value = codigoElemento.innerText;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);

    // Feedback visual en el botón
    boton.innerText = "¡Copiado!";
    boton.style.background = "#28a745";
    boton.style.color = "white";
    
    setTimeout(() => {
        boton.innerText = "Copiar código";
        boton.style.background = "#e1e1e1";
        boton.style.color = "black";
    }, 2000);
}

async function descargarFavicons() {
    if (modoActual === 'imagen' && !imagenCargada) {
        alert("Por favor, sube una imagen primero.");
        return;
    }

    const zip = new JSZip();
    const tamanos = [
        { name: 'favicon-16x16.png', size: 16 },
        { name: 'favicon-32x32.png', size: 32 },
        { name: 'apple-touch-icon.png', size: 180 },
        { name: 'android-chrome-192x192.png', size: 192 },
        { name: 'android-chrome-512x512.png', size: 512 },
        { name: 'favicon.ico', size: 32 }
    ];

    const tempCanvas = document.createElement('canvas');

    tamanos.forEach(item => {
        tempCanvas.width = item.size;
        tempCanvas.height = item.size;
        dibujarEnCanvas(tempCanvas);
        
        const dataUrl = tempCanvas.toDataURL('image/png');
        const base64Data = dataUrl.split(',')[1];
        zip.file(item.name, base64Data, { base64: true });
    });

    const manifestContent = {
        "name": "Weblocal Studio Favicon Kit",
        "short_name": "WLS Favicon",
        "icons": [
            {
                "src": "/android-chrome-192x192.png",
                "sizes": "192x192",
                "type": "image/png"
            },
            {
                "src": "/android-chrome-512x512.png",
                "sizes": "512x512",
                "type": "image/png"
            }
        ],
        "theme_color": "#ffffff",
        "background_color": "#ffffff",
        "display": "standalone"
    };

    zip.file("site.webmanifest", JSON.stringify(manifestContent, null, 2));

    zip.generateAsync({ type: "blob" }).then(function (content) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = "favicons-weblocalstudio.zip";
        link.click();
    });
}

window.onload = () => {
    actualizarFavicon();
};