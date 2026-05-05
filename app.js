document.addEventListener('DOMContentLoaded', () => {

    const USER_ADMIN = { email: 'admin@wallet.com', pass: '123456', nombre: 'Administrador' };

    const DATA_INICIAL = {
        saldoTotal: 14186.55,
        mascota: { nivel: 1, xp: 0 },
        cuentas: [
            { id: 1, nombre: 'Ahorros', monto: 9000.00 },
            { id: 2, nombre: 'Banco', monto: 3200.00 },
            { id: 3, nombre: 'Efectivo', monto: 1500.00 },
            { id: 4, nombre: 'Crédito', monto: 486.55 }
        ],
        movimientos: [
            { id: 101, concepto: 'Depósito nómina', categoria: 'Ingreso', monto: 2500.00, cuentaId: 2 },
            { id: 102, concepto: 'Taxi', categoria: 'Transporte', monto: -15.00, cuentaId: 3 },
            { id: 103, concepto: 'Almuerzo', categoria: 'Comidas', monto: -15.00, cuentaId: 3 },
            { id: 104, concepto: 'Spotify', categoria: 'Suscripción', monto: -12.99, cuentaId: 4 }
        ]
    };

    if (!localStorage.getItem('walletData')) {
        localStorage.setItem('walletData', JSON.stringify(DATA_INICIAL));
    }
    let walletData = JSON.parse(localStorage.getItem('walletData'));

    // Parche por si el LocalStorage antiguo no tenía mascota
    if(!walletData.mascota) walletData.mascota = { nivel: 1, xp: 0 };

    // === GESTIÓN DE VISTAS (SPA) ===
    const vistas = {
        login: document.getElementById('vista-login'),
        dashboard: document.getElementById('vista-dashboard'),
        perfil: document.getElementById('vista-perfil'),
        mascota: document.getElementById('vista-mascota')
    };

    function cambiarVista(vistaActiva) {
        Object.values(vistas).forEach(v => v.classList.add('oculto'));
        vistas[vistaActiva].classList.remove('oculto');
    }

    if (localStorage.getItem('sesionActiva')) { iniciarAplicacion(); }

    // Autenticación
    document.getElementById('form-login').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-pass').value;

        if (email === USER_ADMIN.email && pass === USER_ADMIN.pass) {
            localStorage.setItem('sesionActiva', 'true');
            document.getElementById('error-login').classList.add('oculto');
            iniciarAplicacion();
        } else {
            document.getElementById('error-login').classList.remove('oculto');
        }
    });

    function cerrarSesion() {
        localStorage.removeItem('sesionActiva');
        cambiarVista('login');
        document.getElementById('form-login').reset();
    }
    document.getElementById('btn-cerrar-sesion').addEventListener('click', cerrarSesion);
    document.getElementById('btn-salir-menu').addEventListener('click', cerrarSesion);
    if(document.getElementById('btn-salir-menu2')) document.getElementById('btn-salir-menu2').addEventListener('click', cerrarSesion);

    // Pestañas
    document.getElementById('tab-dashboard').addEventListener('click', () => cambiarVista('dashboard'));
    document.getElementById('tab-dashboard-volver').addEventListener('click', () => cambiarVista('dashboard'));
    if(document.getElementById('tab-dashboard-volver-mascota')) document.getElementById('tab-dashboard-volver-mascota').addEventListener('click', () => cambiarVista('dashboard'));
    
    document.getElementById('tab-perfil').addEventListener('click', () => cambiarVista('perfil'));
    if(document.getElementById('tab-perfil2')) document.getElementById('tab-perfil2').addEventListener('click', () => cambiarVista('perfil'));
    
    document.getElementById('tab-mascota').addEventListener('click', () => cambiarVista('mascota'));
    if(document.getElementById('tab-mascota2')) document.getElementById('tab-mascota2').addEventListener('click', () => cambiarVista('mascota'));


    // === RENDERIZADO CORE ===
    function iniciarAplicacion() {
        cambiarVista('dashboard');
        document.getElementById('saludo-usuario').innerText = `Hola, ${USER_ADMIN.nombre}`;
        document.getElementById('perfil-nombre-ui').innerText = USER_ADMIN.nombre;
        document.getElementById('perfil-email-ui').innerText = USER_ADMIN.email;
        recalcularSaldoTotal();
        actualizarUI();
    }

    function recalcularSaldoTotal() {
        walletData.saldoTotal = walletData.cuentas.reduce((acc, cuenta) => acc + cuenta.monto, 0);
    }

    function actualizarUI() {
        document.getElementById('saldo-total-pantalla').innerText = `S/ ${walletData.saldoTotal.toLocaleString('en-US', {minimumFractionDigits: 2})}`;

        // Render Cuentas
        const contenedorCuentas = document.getElementById('lista-cuentas-ui');
        contenedorCuentas.innerHTML = '';
        walletData.cuentas.forEach((cuenta, index) => {
            const colorClass = `cuenta-${index % 4}`; 
            contenedorCuentas.innerHTML += `
                <div class="tarjeta-cuenta ${colorClass}">
                    <h3>${cuenta.nombre}</h3>
                    <p class="monto">S/ ${parseFloat(cuenta.monto).toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                </div>
            `;
        });

        // Render Movimientos
        const contenedorMovimientos = document.getElementById('lista-movimientos-ui');
        contenedorMovimientos.innerHTML = '';
        walletData.movimientos.slice(0, 4).forEach(mov => {
            const isIngreso = mov.monto > 0;
            const claseColor = isIngreso ? 'texto-ingreso' : 'texto-gasto';
            const signo = isIngreso ? '+' : '';
            
            // Buscar nombre de la cuenta (usando == para evitar bugs de strings)
            const ctaRef = walletData.cuentas.find(c => c.id == mov.cuentaId);
            const nombreCta = ctaRef ? ctaRef.nombre : 'Cuenta Eliminada';

            contenedorMovimientos.innerHTML += `
                <div class="movimiento-item">
                    <div class="detalle-movimiento">
                        <strong>${mov.concepto}</strong><br>
                        <small>${mov.categoria} • <i style="color:var(--texto-claro)">${nombreCta}</i></small>
                    </div>
                    <div class="monto-movimiento ${claseColor}">${signo}S/ ${mov.monto.toFixed(2)}</div>
                </div>
            `;
        });

        actualizarMascotaUI();
        localStorage.setItem('walletData', JSON.stringify(walletData));
    }

    // === LÓGICA DE MASCOTA ===
    function actualizarMascotaUI() {
        const lvl = walletData.mascota.nivel;
        const xp = walletData.mascota.xp;
        const metaXp = lvl * 1000; // Meta: Nvl 1 = 1000, Nvl 2 = 2000...
        const porcentaje = Math.min((xp / metaXp) * 100, 100);

        document.getElementById('nav-mascota-lvl').innerText = lvl;
        if(document.getElementById('nav-mascota-lvl2')) document.getElementById('nav-mascota-lvl2').innerText = lvl;
        
        document.getElementById('mascota-nivel-ui').innerText = `Nivel ${lvl}`;
        document.getElementById('mascota-xp-ui').innerText = xp;
        document.getElementById('mascota-meta-ui').innerText = metaXp;
        document.getElementById('mascota-barra-ui').style.width = `${porcentaje}%`;
    }

    function ganarExperiencia(montoIngreso) {
        // Ganas 1 XP por cada Sol ahorrado/ingresado
        const xpGanado = Math.floor(montoIngreso); 
        if (xpGanado > 0) {
            walletData.mascota.xp += xpGanado;
            let metaXp = walletData.mascota.nivel * 1000;
            
            // Loop para múltiples niveles si el ingreso es gigante
            while (walletData.mascota.xp >= metaXp) {
                walletData.mascota.xp -= metaXp; 
                walletData.mascota.nivel += 1;
                metaXp = walletData.mascota.nivel * 1000;
                alert(`¡Gatito Feliz! 🐱 Tu mascota subió al Nivel ${walletData.mascota.nivel}`);
            }
        }
    }

    // === GESTIÓN DE MODALES ===
    function abrirModal(idHtml) { document.getElementById(idHtml).classList.remove('oculto'); }
    function cerrarModal(idHtml) { document.getElementById(idHtml).classList.add('oculto'); }

    // DELEGACIÓN (Soluciona el error del botón X)
    document.body.addEventListener('click', (e) => {
        
        // 1. Cerrar Modal (closest busca hacia arriba hasta encontrar el botón)
        const btnCerrar = e.target.closest('.btn-cerrar-modal');
        if (btnCerrar) {
            cerrarModal(btnCerrar.getAttribute('data-modal'));
            return;
        }
        
        // 2. Editar Cuenta
        const btnEditar = e.target.closest('.btn-editar');
        if (btnEditar) {
            const id = btnEditar.getAttribute('data-id');
            const cuenta = walletData.cuentas.find(c => c.id == id);
            if(cuenta) {
                document.getElementById('cuenta-id').value = cuenta.id;
                document.getElementById('cuenta-nombre').value = cuenta.nombre;
                document.getElementById('cuenta-saldo').value = cuenta.monto;
                document.getElementById('titulo-form-cuenta').innerText = 'Editar Cuenta';
                cerrarModal('modal-gestionar-cuentas');
                abrirModal('modal-form-cuenta');
            }
            return;
        }

        // 3. Eliminar Cuenta
        const btnEliminar = e.target.closest('.btn-eliminar');
        if (btnEliminar) {
            const id = btnEliminar.getAttribute('data-id');
            if(confirm('¿Seguro que deseas eliminar esta cuenta permanentemente?')) {
                walletData.cuentas = walletData.cuentas.filter(c => c.id != id);
                recalcularSaldoTotal();
                actualizarUI();
                renderizarListaGestionCuentas(); 
            }
            return;
        }
    });

    // === MOVIMIENTOS E HISTORIAL ===
    document.getElementById('btn-ver-movimientos').addEventListener('click', (e) => {
        e.preventDefault();
        const listaHistorial = document.getElementById('lista-historial-modal');
        listaHistorial.innerHTML = '';
        
        walletData.movimientos.forEach(mov => {
            const isIngreso = mov.monto > 0;
            const claseColor = isIngreso ? 'texto-ingreso' : 'texto-gasto';
            const signo = isIngreso ? '+' : '';
            const ctaRef = walletData.cuentas.find(c => c.id == mov.cuentaId);
            
            listaHistorial.innerHTML += `
                <div class="item-cuenta-modal">
                    <div>
                        <strong>${mov.concepto}</strong><br>
                        <small style="color: var(--texto-claro)">${mov.categoria} • Cta: ${ctaRef ? ctaRef.nombre : 'Cuenta Eliminada'}</small>
                    </div>
                    <strong class="${claseColor}">${signo}S/ ${Math.abs(mov.monto).toFixed(2)}</strong>
                </div>
            `;
        });
        abrirModal('modal-historial');
    });

    // === FORMULARIO DE GASTOS ===
    document.getElementById('btn-abrir-gasto').addEventListener('click', () => {
        const selectCuentas = document.getElementById('gasto-cuenta');
        selectCuentas.innerHTML = '';
        
        if (walletData.cuentas.length === 0) {
            selectCuentas.innerHTML = `<option value="">⚠️ No hay cuentas creadas</option>`;
        } else {
            walletData.cuentas.forEach(c => {
                selectCuentas.innerHTML += `<option value="${c.id}">${c.nombre} (Disp: S/ ${c.monto.toFixed(2)})</option>`;
            });
        }
        abrirModal('modal-gasto');
    });

    document.getElementById('form-gasto').addEventListener('submit', (e) => {
        e.preventDefault();
        const tipo = document.getElementById('gasto-tipo').value;
        const idCuenta = document.getElementById('gasto-cuenta').value;
        const concepto = document.getElementById('gasto-concepto').value;
        const categoria = document.getElementById('gasto-categoria').value;
        let monto = parseFloat(document.getElementById('gasto-monto').value) || 0;

        if(!idCuenta) {
            alert("Debes crear al menos una cuenta antes de registrar movimientos.");
            return;
        }

        if (tipo === 'ingreso') {
            ganarExperiencia(monto);
            monto = Math.abs(monto);
        } else {
            monto = -Math.abs(monto);
        }

        // Afectar el saldo de la cuenta usando '==' (ignora si uno es texto y otro número)
        const cuentaIndex = walletData.cuentas.findIndex(c => c.id == idCuenta);
        if (cuentaIndex !== -1) {
            walletData.cuentas[cuentaIndex].monto += monto;
        }

        walletData.movimientos.unshift({ id: Date.now(), concepto, categoria, monto, cuentaId: idCuenta });

        recalcularSaldoTotal();
        actualizarUI();
        cerrarModal('modal-gasto');
        e.target.reset();
    });

    // === FORMULARIO DE CUENTAS ===
    document.getElementById('btn-gestionar-cuentas').addEventListener('click', renderizarListaGestionCuentas);

    function renderizarListaGestionCuentas() {
        const listaModal = document.getElementById('lista-cuentas-modal');
        listaModal.innerHTML = '';
        walletData.cuentas.forEach(c => {
            listaModal.innerHTML += `
                <div class="item-cuenta-modal">
                    <div class="item-cuenta-info">
                        <h4>${c.nombre}</h4>
                        <p>S/ ${c.monto.toFixed(2)}</p>
                    </div>
                    <div class="item-cuenta-acciones">
                        <button class="btn-accion btn-editar" data-id="${c.id}">✎</button>
                        <button class="btn-accion btn-eliminar" data-id="${c.id}">🗑</button>
                    </div>
                </div>
            `;
        });
        abrirModal('modal-gestionar-cuentas');
    }

    document.getElementById('btn-abrir-nueva-cuenta').addEventListener('click', () => {
        document.getElementById('form-cuenta').reset();
        document.getElementById('cuenta-id').value = ''; 
        document.getElementById('titulo-form-cuenta').innerText = 'Nueva Cuenta';
        cerrarModal('modal-gestionar-cuentas');
        abrirModal('modal-form-cuenta');
    });

    document.getElementById('form-cuenta').addEventListener('submit', (e) => {
        e.preventDefault();
        const idActual = document.getElementById('cuenta-id').value;
        const nombre = document.getElementById('cuenta-nombre').value;
        const monto = parseFloat(document.getElementById('cuenta-saldo').value) || 0;

        if (idActual) {
            const cuenta = walletData.cuentas.find(c => c.id == idActual);
            cuenta.nombre = nombre;
            cuenta.monto = monto;
        } else {
            walletData.cuentas.push({ id: Date.now(), nombre, monto });
        }

        recalcularSaldoTotal();
        actualizarUI();
        cerrarModal('modal-form-cuenta');
    });

});