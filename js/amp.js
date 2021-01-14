window.AudioContext = window.AudioContext ||
    window.webkitAudioContext;

//  TODO: 
//  implementar boton de encendido y apagado del amplificador
//  implementar que cuando se encienda el contexto de audio se encenda el amplificador
//  implementar efectos
//  Agregar distorsion
//  implementar loop de efectos
//  implementar ganancia en amplificador
//  implementar afinador
//  implementar guias visuales que indiquen si está encendido o apagado un efecto o filtro
//  * CHECK implementar impulsos de gabinete
//  implementar cambio de impulso de gabinete
//
// TODO: revisar si los contextos se pueden combinar

var context;
var microphone;
var filterEffect;
var gainNode; // Volumen
var bassNode; // Bajos
var midNode; // Medios
var trebleNode; // Agudos
var cabinet;    // Impulso de gabinete
var estadoAmp = false; //Estado del amplificador
var estadoDis = false; // Estado del efecto distorsion
var estadoDil = false; // Estado del efecto delay
var estadoRev = false; // Estado del efecto reverb
var estadoCho = 1; // Estado del efecto chorus
var estadoTre = 1; // Estado del efecto tremolo
var makeUpGain;    // Usado para mejorar el volumen del impulso de gabinete
var distortion;    // Efecto de distorsion
var reverb;        // Efecto de reverb
const canvas = document.getElementById("visualizador");
var analyser;      // Analizador para el vizualizador de ondas

// variables delay
var filterDel
var delay
var feedback
var delayGain
var delayPrueba




// Esta función enciende el contexto de audio y declara todos los nodos necesarios para el funcionamiento
function encender() {
    // Declara el contexto de audio
    context = new AudioContext();

    // Pedir permiso para usar el micrófono
    navigator.mediaDevices.getUserMedia({
        audio: {
            echoCancellation: false,
            autoGainControl: false,
            noiseSuppression: false,
            channelCount: 1,
            latency: 0
        }
    }).then((stream) => {
        microphone = context.createMediaStreamSource(stream);
        microphone.connect(context.destination);
        visualizador()
    });

    // Nodo de volumen
    gainNode = context.createGain({ active: true });

    // Nodo de bajos
    bassNode = new BiquadFilterNode(context, {
        type: 'lowshelf',
        frequency: 300,
        gain: bassControl.value
    });

    // Nodo de medios
    midNode = new BiquadFilterNode(context, {
        type: 'peaking',
        Q: Math.SQRT1_2,
        frequency: 600,
        gain: midControl.value
    });

    // Nodo de agudos
    trebleNode = new BiquadFilterNode(context, {
        type: 'highshelf',
        frequency: 3200,
        gain: trebleControl.value
    });



    makeUpGain = new GainNode(context, {
        // Need to be adjusted to a particular IR.
        gain: 3
    });

    // Creacion del efecto de distorsion
    distortion = new WaveShaperNode(context, {
        channelCount: 2,
        channelCountMode: "max",
        channelInterpretation: "discrete",
        curve: makeDistortionCurve(400),
    });


    // // *Creacion del efecto delay
    // delay = context.createDelay();
    // delay.delayTime.value = 0.5;

    // feedback = context.createGain();
    // feedback.gain.value = 0.8;

    // filter = context.createBiquadFilter();
    // filter.frequency.value = 1000;

    // delay.connect(feedback);

    // *Creacion del efecto delay
    delay = context.createDelay();
    delay.delayTime.value = 0.5;

    feedback = context.createGain();
    feedback.gain.value = 0.8;

    filter = context.createBiquadFilter();
    filter.frequency.value = 1000;

    // delay.connect(feedback);
    feedback.connect(filter);
    filter.connect(delay);

    // -------CABINET IMPULSE RESPONSE---------
    cabinet = new ConvolverNode(context);
    fetch('/assets/impulses/cabinet/Hesu 2x12 V30 - 440 center edge.wav')
        .then(response => response.arrayBuffer())
        .then(buffer => {
            context.decodeAudioData(buffer, decoded => {
                cabinet.buffer = decoded;
            })
                .catch((err) => console.error(err));
        });

    // Creacion del efecto de reverb
    reverb = context.createConvolver();
    fetch('/assets/impulses/reverb/Conic Long Echo Hall.wav')
        .then(response => response.arrayBuffer())
        .then(data => {
            return context.decodeAudioData(data, buffer => {
                reverb.buffer = buffer;
            });
        });
}

// Apagar el sonido
function apagar() {
    context.suspend();
    console.log(context.state)
}

// Apagar y encender el sonido
function connectDisconnect() {
    var luz = document.getElementById("encender");
    luz.style = 'color:#cc0f08; border: 2px solid #cc0f08; border-color: #cc0f08; box-shadow: 0 0 10px #cc0f08;';

    try {
        if (context.state == "running") {
            luz.style = 'color: #fff';
            apagar();
        } else if (context.state == "suspended") {
            luz.style = 'color:#cc0f08; border: 2px solid #cc0f08; border-color: #cc0f08; box-shadow: 0 0 10px #cc0f08;';
            context.resume();
        }
    } catch (error) {
        encender();
    }
}

// --------------CONTROLES DEL AMPLIFICADOR------------------

//PRENDER Y APAGAR EL AMPLIFICADOR

function ampOnOff() {
    var luz2 = document.getElementById("encenderAmp");
    if (estadoAmp == false) {
        luz2.style = 'color:#cc0f08; border: 2px solid #cc0f08; border-color: #cc0f08; box-shadow: 0 0 10px #cc0f08;';
        estadoAmp = true;
        microphone.connect(bassNode)
            .connect(midNode)
            .connect(trebleNode)
            .connect(cabinet)
            .connect(makeUpGain)
            .connect(gainNode)
            .connect(analyser)
        // ! Importante conservar la línea de abajo para que no se haga ruido doble
        gainNode.connect(context.destination);
        microphone.disconnect(context.destination);
        microphone.disconnect(analyser);
        console.log("Amp ON");
    }
    else {
        luz2.style = 'color:#fff;';
        estadoAmp = false;
        console.log("Amp OFF");
        gainNode.disconnect();
        microphone.connect(context.destination);
        microphone.connect(analyser);
    }
}

// control de volumen
const volumeControl = document.querySelector('[data-action="volume"]');
volumeControl.addEventListener('input', function () {
    gainNode.gain.value = this.value;
}, false);

// control bajos
const bassControl = document.querySelector('[data-action="bass"]');
bassControl.addEventListener('input', function () {
    bassNode.gain.value = this.value;
}, false);

// control de medios
const midControl = document.querySelector('[data-action="mid"]');
midControl.addEventListener('input', function () {
    midNode.gain.value = this.value;
}, false);

// control de agudos
const trebleControl = document.querySelector('[data-action="treble"]');
trebleControl.addEventListener('input', function () {
    trebleNode.gain.value = this.value;
}, false);


// (function () {
//     var controls = $("div#sliders");

//     controls.find("input[name='delayTime']").on('input', function () {
//         delay.delayTime.value = $(this).val();
//     });

//     controls.find("input[name='feedback']").on('input', function () {
//         feedback.gain.value = $(this).val();
//     });

//     controls.find("input[name='frequency']").on('input', function () {
//         filter.frequency.value = $(this).val();
//     });
// })();

//INICIAR LOS NODOS DEL AMPLIFICADOR
async function connectAmpNodes() {



    const tremoloDefaults = {
        speed: 3,
        depth: 0.3,
        wave: 'sine',
        active: true
    };

    // Creacion del efecto chorus
    const chorus = context.createDelay();
    const chorus2 = context.createDelay();
    const chorus3 = context.createDelay();
    const mixIn = context.createGain();
    const mixOut = context.createGain();

    // Asignar los valores defecto
    mixIn.gain.value = 1 - defaults.mix;
    mixOut.gain.value = defaults.mix;

    const step = 0.001;
    const min = 0.015;
    const max = 0.025;
    let timeModulation = min;
    let goingUp = true;
    chorus.delayTime.value = timeModulation;
    chorus2.delayTime.value = timeModulation + step;
    chorus3.delayTime.value = timeModulation + step + step;

    const modulate = () => {
        if (goingUp) {
            timeModulation += step;
            if (timeModulation >= max) {
                goingUp = false;
            }
        } else {
            timeModulation -= step;

            if (timeModulation <= min) {
                goingUp = true;
            }
        }
        chorus.delayTime = timeModulation;
        chorus2.delayTime = timeModulation + step;
        chorus3.delayTime = timeModulation + step + step;
    };

    // Creacion del efecto tremolo
    const sum = context.createGain();
    const lfo = context.createOscillator();
    const tremolo = context.createGain();
    const depthIn = context.createGain();
    const depthOut = context.createGain();

    // Definir valores por defecto
    lfo.frequency.value = tremoloDefaults.speed;
    depthIn.gain.value = 1 - tremoloDefaults.depth;
    depthOut.gain.value = tremoloDefaults.depth;

    // ----------- CONECTAR EL MICROFONO, NODOS Y EFECTOS HACIA LA SALIDA DE AUDIO --------------




    // Efecto chorus
    if (estadoCho == 0) {
        modulate();
        microphone.connect(chorus);
        microphone.connect(chorus2);
        microphone.connect(chorus3);
        chorus.connect(mixOut);
        chorus2.connect(mixOut);
        chorus3.connect(mixOut);
        mixOut.connect(gainNode);
        microphone.connect(mixIn);
        mixIn.connect(gainNode);
    }
    else {
        chorus.disconnect();
        chorus2.disconnect();
        chorus3.disconnect()
        mixIn.disconnect();
    }

    // Efecto tremolo
    if (estadoTre == 0) {
        lfo.connect(tremolo.gain);
        lfo.start();
        microphone.connect(tremolo);
        tremolo.connect(depthOut);
        depthOut.connect(sum);
        microphone.connect(depthIn);
        depthIn.connect(gainNode);
    }
    else {
        lfo.disconnect();
        tremolo.disconnect();
    }
}

// * --------------CONTROLES DE EFECTOS DE PEDALES------------------

// * Distorsion
function distorsionOnOff() {
    var led1 = document.getElementById("pedalDis");

    if (estadoAmp == true) {
        if (estadoDis == false) {
            led1.style = 'color:#cc0f08; border: 2px solid #cc0f08; border-color: #cc0f08; box-shadow: 0 0 10px #cc0f08;';
            estadoDis = true;
            console.log("Distorsion ON");
            microphone.connect(distortion);
            distortion.connect(gainNode);
        } else {
            led1.style = 'color:#fff;';
            estadoDis = false;
            console.log("Distorsion OFF");
            distortion.disconnect();
        }
    }
    else {
        if (estadoDis == false) {
            led1.style = 'color:#cc0f08; border: 2px solid #cc0f08; border-color: #cc0f08; box-shadow: 0 0 10px #cc0f08;';
            estadoDis = true;
            console.log("Distorsion ON");
            microphone.connect(distortion);
            distortion.connect(context.destination);
            microphone.disconnect(context.destination);
        } else {
            led1.style = 'color:#fff;';
            estadoDis = false;
            console.log("Distorsion OFF");
            distortion.disconnect();
            microphone.connect(context.destination);
        }
    }
}

function makeDistortionCurve(amount) {
    var k = typeof amount === 'number' ? amount : 50,
        n_samples = 44100,
        curve = new Float32Array(n_samples),
        deg = Math.PI / 180,
        i = 0,
        x;
    for (; i < n_samples; ++i) {
        x = i * 2 / n_samples - 1;
        curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
    }
    return curve;
};

// * Delay
function delayOnOff() {
    var led2 = document.getElementById("pedalDel");

    if (estadoAmp == true) {
        if (estadoDis == false) {
            led2.style = 'color:#cc0f08; border: 2px solid #cc0f08; border-color: #cc0f08; box-shadow: 0 0 10px #cc0f08;';
            estadoDil = true;
            console.log("Delay ON con amp");
            gainNode.connect(delay);
            delay.connect(context.destination);
        } else {
            led2.style = 'color:#fff;';
            estadoDis = false;
            console.log("Delay OFF");
            delay.disconnect(context.destination);
        }
    }
    else {
        if (estadoDis == false) {
            led2.style = 'color:#cc0f08; border: 2px solid #cc0f08; border-color: #cc0f08; box-shadow: 0 0 10px #cc0f08;';
            estadoDis = true;
            console.log("Delay ON");
            microphone.connect(delay);
            delay.connect(context.destination);
        } else {
            led2.style = 'color:#fff;';
            estadoDis = false;
            console.log("Delay OFF");
            delay.disconnect(context.destination);
        }
    }
}

// * Reverb
function reverbOnOff() {
    var led3 = document.getElementById("pedalRev");

    if (estadoAmp == true) {
        if (estadoRev == false) {
            led3.style = 'color:#cc0f08; border: 2px solid #cc0f08; border-color: #cc0f08; box-shadow: 0 0 10px #cc0f08;';
            estadoRev = true;
            console.log("Reverb ON");
            microphone.connect(reverb)
                .connect(gainNode);

        }
        else {
            led3.style = 'color:#fff;';
            estadoRev = false;
            console.log("Reverb OFF");
            reverb.disconnect();
        }
    }
    else {
        if (estadoRev == false) {
            led3.style = 'color:#cc0f08; border: 2px solid #cc0f08; border-color: #cc0f08; box-shadow: 0 0 10px #cc0f08;';
            estadoRev = true;
            console.log("Reverb ON");
            microphone.connect(reverb)
                .connect(context.destination);
            // microphone.disconnect(context.destination);
        }
        else {
            led3.style = 'color:#fff;';
            estadoRev = false;
            console.log("Reverb OFF");
            reverb.disconnect();
            // microphone.connect(context.destination);
        }
    }
}


// * Chorus
function chorusOnOff() {
    var led4 = document.getElementById("pedalCho");
    if (estadoCho == 1) {
        led4.style = 'color:#cc0f08; border: 2px solid #cc0f08; border-color: #cc0f08; box-shadow: 0 0 10px #cc0f08;';
        estadoCho = 0;
        console.log("Chorus ON");
    }
    else {
        led4.style = 'color:#fff;';
        estadoCho = 1;
        console.log("Chorus OFF");
    }
}

// * Tremolo
function tremoloOnOff() {
    var led5 = document.getElementById("pedalTre");
    if (estadoTre == 1) {
        led5.style = 'color:#cc0f08; border: 2px solid #cc0f08; border-color: #cc0f08; box-shadow: 0 0 10px #cc0f08;';
        estadoTre = 0;
        console.log("Tremolo ON");
    }
    else {
        led5.style = 'color:#fff;';
        estadoTre = 1;
        console.log("Tremolo OFF");
    }
}

// --------------VISUALIZADOR DEL MICROFONO------------------
function visualizador() {

    canvas.width = window.innerWidth;
    canvas.height = 300;
    const canvasCtx = canvas.getContext("2d");
    WIDTH = canvas.width;
    HEIGHT = canvas.height;

    analyser = context.createAnalyser(); // Crea un analizador de audio

    microphone.connect(analyser); // Conecta el microfono al analizador

    analyser.fftSize = 2048;
    var bufferLength = analyser.frequencyBinCount; // la mitad del valor de FFT
    var dataArray = new Uint8Array(bufferLength); // crear una matriz para almacenar los datos

    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

    function draw() {

        drawVisual = requestAnimationFrame(draw);

        analyser.getByteTimeDomainData(dataArray); // obtener datos de forma de onda y ponerlo en la matriz creada arriba

        canvasCtx.fillStyle = 'rgb(200, 200, 200)'; // dibujar onda con canvas
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

        canvasCtx.beginPath();

        var sliceWidth = WIDTH * 1.0 / bufferLength;
        var x = 0;

        if (context.state == "suspended") {
            sliceWidth = WIDTH * HEIGHT / 2;
        }

        for (var i = 0; i < bufferLength; i++) {

            var v = dataArray[i] / 128.0;
            var y = v * HEIGHT / 2;

            if (i === 0) {
                canvasCtx.moveTo(x, y);
            } else {
                canvasCtx.lineTo(x, y);
            }
            x += sliceWidth;
        }
        canvasCtx.lineTo(canvas.width, canvas.height / 2);
        canvasCtx.stroke();
    };
    draw();
}