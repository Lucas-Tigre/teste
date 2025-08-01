const connectBtn = document.getElementById('connect-btn');
const statusEl = document.getElementById('connection-status');

let port;
let reader;

async function connectJoystick() {
  try {
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: 115200 }); // Match com o Arduino!
    
    reader = port.readable.getReader();
    statusEl.textContent = "Conectado - Movendo o joystick...";
    statusEl.style.color = "green";
    
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      
      const data = new TextDecoder().decode(value);
      console.log("Dados recebidos:", data); // Verifique no console F12
      
      // Atualiza a interface
      const [x, y, btn] = data.trim().split(',');
      document.getElementById('x-value').textContent = x;
      document.getElementById('y-value').textContent = y;
      document.getElementById('btn-value').textContent = 
        btn === '1' ? 'PRESSIONADO' : 'solto';
    }
  } catch (error) {
    statusEl.textContent = `Erro: ${error.message}`;
    statusEl.style.color = "red";
    console.error("Falha na conexão:", error);
  }
}

connectBtn.addEventListener('click', () => {
  if (!port) connectJoystick();
});