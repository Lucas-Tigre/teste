// Elementos da interface
const connectBtn = document.getElementById('connect-btn');
const joystickIndicator = document.getElementById('joystick-indicator');
const xValue = document.getElementById('x-value');
const yValue = document.getElementById('y-value');
const btnValue = document.getElementById('btn-value');
const connectionStatus = document.getElementById('connection-status');

// Variáveis de controle
let serialPort = null;
let reader = null;
let isConnected = false;

// Cores para feedback visual
const colors = {
    active: '#FF5722',
    inactive: '#4CAF50',
    pressed: '#F44336',
    default: '#607D8B'
};

// Evento de clique no botão de conexão
connectBtn.addEventListener('click', async () => {
    if (!isConnected) {
        await connectJoystick();
    } else {
        await disconnectJoystick();
    }
});

// Função para conectar o joystick
async function connectJoystick() {
    try {
        // Verifica se a API Serial está disponível
        if (!('serial' in navigator)) {
            throw new Error('API Serial não suportada neste navegador. Use Chrome ou Edge.');
        }

        // Solicita acesso à porta serial
        serialPort = await navigator.serial.requestPort();
        await serialPort.open({ baudRate: 9600 });

        // Configura o leitor de dados
        const textDecoder = new TextDecoderStream();
        const readableStreamClosed = serialPort.readable.pipeTo(textDecoder.writable);
        reader = textDecoder.readable.getReader();

        // Atualiza a interface
        isConnected = true;
        connectBtn.textContent = 'Desconectar Joystick';
        connectionStatus.textContent = 'Status: Conectado';
        connectionStatus.className = 'connected';
        joystickIndicator.style.backgroundColor = colors.inactive;

        // Loop de leitura dos dados
        while (isConnected) {
            try {
                const { value, done } = await reader.read();
                if (done) {
                    console.log('Leitura concluída');
                    break;
                }
                
                // Processa os dados recebidos
                if (value) {
                    processJoystickData(value.trim());
                }
            } catch (readError) {
                console.error('Erro na leitura:', readError);
                break;
            }
        }
    } catch (error) {
        console.error('Erro na conexão:', error);
        connectionStatus.textContent = `Erro: ${error.message}`;
        connectionStatus.className = 'disconnected';
        isConnected = false;
        connectBtn.textContent = 'Conectar Joystick';
    }
}

// Função para processar os dados do joystick
function processJoystickData(data) {
    try {
        // Extrai os valores dos eixos e botão
        const xMatch = data.match(/X:(\d+)/);
        const yMatch = data.match(/Y:(\d+)/);
        const btnMatch = data.match(/BTN:(\d)/);

        if (xMatch && yMatch && btnMatch) {
            const x = parseInt(xMatch[1]);
            const y = parseInt(yMatch[1]);
            const btnState = parseInt(btnMatch[1]);

            // Atualiza os valores na tela
            xValue.textContent = x;
            yValue.textContent = y;
            btnValue.textContent = btnState ? 'PRESSIONADO' : 'NÃO PRESSIONADO';
            btnValue.style.color = btnState ? colors.pressed : '#FFF';

            // Calcula a posição normalizada (-100 a 100)
            const posX = ((x - 512) / 512) * 100;
            const posY = ((y - 512) / 512) * 100;

            // Atualiza o joystick visual
            joystickIndicator.style.transform = `translate(${posX}px, ${posY}px)`;
            
            // Muda a cor quando ativo
            const isActive = Math.abs(posX) > 10 || Math.abs(posY) > 10;
            joystickIndicator.style.backgroundColor = isActive ? colors.active : colors.inactive;
        }
    } catch (error) {
        console.error('Erro ao processar dados:', error);
    }
}

// Função para desconectar o joystick
async function disconnectJoystick() {
    try {
        if (reader) {
            await reader.cancel();
            await reader.releaseLock();
            reader = null;
        }
        
        if (serialPort) {
            await serialPort.close();
            serialPort = null;
        }
        
        // Reseta a interface
        isConnected = false;
        connectBtn.textContent = 'Conectar Joystick';
        connectionStatus.textContent = 'Status: Desconectado';
        connectionStatus.className = 'disconnected';
        
        joystickIndicator.style.transform = 'translate(0, 0)';
        joystickIndicator.style.backgroundColor = colors.default;
        
        xValue.textContent = '0';
        yValue.textContent = '0';
        btnValue.textContent = 'NÃO PRESSIONADO';
        btnValue.style.color = '#FFF';
    } catch (error) {
        console.error('Erro ao desconectar:', error);
    }
}

// Verifica a compatibilidade do navegador ao carregar a página
window.addEventListener('DOMContentLoaded', () => {
    if (!('serial' in navigator)) {
        connectionStatus.textContent = 'API Serial não suportada. Use Chrome/Edge.';
        connectionStatus.className = 'disconnected';
        connectBtn.disabled = true;
    }
});