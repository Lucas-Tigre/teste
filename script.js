const connectBtn = document.getElementById('connect-btn');
const joystickIndicator = document.getElementById('joystick-indicator');
const xValue = document.getElementById('x-value');
const yValue = document.getElementById('y-value');
const btnValue = document.getElementById('btn-value');
const connectionStatus = document.getElementById('connection-status');

let serialPort = null;
let isConnected = false;

// Cores para feedback visual
const colors = {
    active: '#FF5722',
    inactive: '#4CAF50',
    pressed: '#F44336'
};

connectBtn.addEventListener('click', async () => {
    if (!isConnected) {
        try {
            // Solicita porta serial
            serialPort = await navigator.serial.requestPort();
            await serialPort.open({ baudRate: 9600 });
            
            const textDecoder = new TextDecoderStream();
            const readableStreamClosed = serialPort.readable.pipeTo(textDecoder.writable);
            const reader = textDecoder.readable.getReader();
            
            isConnected = true;
            connectBtn.textContent = 'Desconectar';
            connectionStatus.textContent = 'Status: Conectado';
            connectionStatus.className = 'connected';
            
            // Atualiza interface enquanto estiver conectado
            while (isConnected) {
                const { value, done } = await reader.read();
                if (done) break;
                
                if (value) {
                    updateUI(value.trim());
                }
            }
        } catch (error) {
            console.error('Erro:', error);
            disconnect();
        }
    } else {
        disconnect();
    }
});

function updateUI(data) {
    // Extrai valores do joystick
    const xMatch = data.match(/X:(\d+)/);
    const yMatch = data.match(/Y:(\d+)/);
    const btnMatch = data.match(/BTN:(\d)/);
    
    if (xMatch && yMatch && btnMatch) {
        const x = parseInt(xMatch[1]);
        const y = parseInt(yMatch[1]);
        const btnState = parseInt(btnMatch[1]);
        
        // Atualiza valores na tela
        xValue.textContent = x;
        yValue.textContent = y;
        btnValue.textContent = btnState ? 'PRESSIONADO' : 'NÃO PRESSIONADO';
        btnValue.style.color = btnState ? colors.pressed : '#FFF';
        
        // Calcula posição do indicador (normalizada para -50px a +50px)
        const posX = ((x - 512) / 512) * 100;
        const posY = ((y - 512) / 512) * 100;
        
        // Move o indicador visual
        joystickIndicator.style.transform = `translate(${posX}px, ${posY}px)`;
        joystickIndicator.style.backgroundColor = 
            (Math.abs(posX) > 20 || Math.abs(posY) > 20) ? colors.active : colors.inactive;
    }
}

function disconnect() {
    if (serialPort) {
        serialPort.close();
    }
    isConnected = false;
    connectBtn.textContent = 'Conectar Joystick';
    connectionStatus.textContent = 'Status: Desconectado';
    connectionStatus.className = 'disconnected';
    
    // Reseta indicador
    joystickIndicator.style.transform = 'translate(0, 0)';
    joystickIndicator.style.backgroundColor = colors.inactive;
    xValue.textContent = '0';
    yValue.textContent = '0';
    btnValue.textContent = 'NÃO PRESSIONADO';
    btnValue.style.color = '#FFF';
}