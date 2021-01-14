////////////// WITH MP3 FILES /////////////////
window.onload = function() {
    const file = document.getElementById("mp3-input");
    const canvas = document.getElementById("visualizador");
    const h3 = document.getElementById("songName");
    const audio = document.getElementById("audio");

    file.onchange = function() {

        const files = this.files; // FileList containing mp3 objects selected by the user 
        console.log('FILES[0]: ', files[0])
        audio.src = URL.createObjectURL(files[0]); // Creates a DOMString containing the specified File object
    
        const name = files[0].name
        h3.innerText = `${name}` // Sets <h3> to the name of the song
    
        ///////// <CANVAS> INITI //////////
        canvas.width = window.innerWidth;
        canvas.height = 300;
        const ctx = canvas.getContext("2d");
        ///////////////////////////////////////////
    
    
        const context = new AudioContext(); // (Interface) Audio-processing graph
        let src = context.createMediaElementSource(audio); // Give the audio context an audio source,
        // to which can then be played and manipulated
        const analyser = context.createAnalyser(); // Create an analyser for the audio context
    
        src.connect(analyser); // Connects the audio context source to the analyser
        analyser.connect(context.destination); // End destination of an audio graph in a given context
        // Sends sound to the speakers or headphones
    
    
        /////////////// ANALYSER FFTSIZE ////////////////////////
        // analyser.fftSize = 32;
        // analyser.fftSize = 64;
        //analyser.fftSize = 128;
        //analyser.fftSize = 256;
        // analyser.fftSize = 512;
        // analyser.fftSize = 1024;
        // analyser.fftSize = 2048;
        analyser.fftSize = 4096;
        // analyser.fftSize = 8192;
        //analyser.fftSize = 16384;
        // analyser.fftSize = 32768;
    
        // (FFT) is an algorithm that samples a signal over a period of time
        // and divides it into its frequency components (single sinusoidal oscillations).
        // It separates the mixed signals and shows what frequency is a violent vibration.
    
        // (FFTSize) represents the window size in samples that is used when performing a FFT
    
        // Lower the size, the less bars (but wider in size)
        ///////////////////////////////////////////////////////////
    
        const bufferLength = analyser.frequencyBinCount; 
    
        const dataArray = new Uint8Array(bufferLength); // Converts to 8-bit unsigned integer array
        // At this point dataArray is an array with length of bufferLength but no values
        console.log('DATA-ARRAY: ', dataArray) // Check out this array of frequency values!
    
        const WIDTH = canvas.width;
        const HEIGHT = canvas.height;
        console.log('WIDTH: ', WIDTH, 'HEIGHT: ', HEIGHT)
    
        const barWidth = (WIDTH / bufferLength) * 13;
        console.log('BARWIDTH: ', barWidth)
    
        console.log('TOTAL WIDTH: ', (117*10)+(118*barWidth)) // (total space between bars)+(total width of all bars)
    
        let barHeight;
        let x = 0;
    
        function renderFrame() {

          requestAnimationFrame(renderFrame); // Takes callback function to invoke before rendering
    
          x = 0;
    
          analyser.getByteFrequencyData(dataArray); // Copies the frequency data into dataArray
          // Results in a normalized array of values between 0 and 255
          // Before this step, dataArray's values are all zeros (but with length of 8192)
    
          ctx.fillStyle = "rgba(0,0,0)"; // Clears canvas before rendering bars 
          ctx.fillRect(0, 0, WIDTH, HEIGHT); // Fade effect, set opacity to 1 for sharper rendering of bars
    
          let r, g, b;
          let bars = 100 // Set total number of bars you want per frame
    
          for (let i = 0; i < bars; i++) {
            barHeight = (dataArray[i] * 1.3);
    
            if (dataArray[i] > 210){ // Purple
              r = 138
              g = 0
              b = 132
            } else if (dataArray[i] > 200){ // Dark Blue
              r = 38
              g = 0
              b = 138
            } else if (dataArray[i] > 190){ // Blue
              r = 0
              g = 52
              b = 132
            } else if (dataArray[i] > 180){ // Light Blue
              r = 0
              g = 133
              b = 138
            } else { // Green
              r = 0
              g = 164
              b = 104
            }
        
                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.fillRect(x, (HEIGHT - barHeight), barWidth, barHeight);
                x += barWidth + 5 // Gives 10px space between each bar
            }
        }
        audio.play();
        renderFrame();
      };
};

