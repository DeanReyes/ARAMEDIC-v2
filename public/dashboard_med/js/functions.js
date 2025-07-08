// Función para generar un nombre aleatorio
function generarNombreAleatorio() {
    const nombres = ['Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Laura', 'Pedro', 'Sofía', 'Miguel', 'Elena'];
    const apellidos = ['García', 'Rodríguez', 'López', 'Martínez', 'González', 'Pérez', 'Sánchez', 'Romero', 'Fernández', 'Torres'];
    
    const nombreAleatorio = nombres[Math.floor(Math.random() * nombres.length)];
    const apellidoAleatorio = apellidos[Math.floor(Math.random() * apellidos.length)];
    
    return `${nombreAleatorio} ${apellidoAleatorio}`;
}

// Función para obtener un avatar aleatorio
function obtenerAvatarAleatorio() {
    const avatares = [
        'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/avatar1-Rl9Wd8Yl8Iy5Uy9Uy0Uy1Uy2Uy3.png',
        'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/avatar2-Rl9Wd8Yl8Iy5Uy9Uy0Uy1Uy2Uy4.png',
        'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/avatar3-Rl9Wd8Yl8Iy5Uy9Uy0Uy1Uy2Uy5.png',
        'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/avatar4-Rl9Wd8Yl8Iy5Uy9Uy0Uy1Uy2Uy6.png'
    ];
    
    return avatares[Math.floor(Math.random() * avatares.length)];
}

// Función para actualizar el perfil de usuario
function actualizarPerfilUsuario() {
    const userProfileElement = document.getElementById('user-profile');
    const nombreUsuario = generarNombreAleatorio();
    const avatarUrl = obtenerAvatarAleatorio();
    
    userProfileElement.innerHTML = `
        <img src="${avatarUrl}" alt="Avatar de usuario" class="profile-image">
        <span class="user-name">${nombreUsuario}</span>
    `;
}

// Función para manejar la navegación
// function manejarNavegacion() {
//     const enlaces = document.querySelectorAll("#sidebar a");
//     const secciones = document.querySelectorAll(".dashboard-section");

//     enlaces.forEach(enlace => {
//         enlace.addEventListener("click", (e) => {
//             e.preventDefault();
//             const targetId = enlace.getAttribute("href").substring(1);

//             if (targetId === "cerrar-sesion") {
//                 cerrarSesion();
//                 return;
//             }

//             enlaces.forEach(el => el.classList.remove("active"));
//             enlace.classList.add("active");

//             secciones.forEach(seccion => {
//                 if (seccion.id === targetId) {
//                     seccion.classList.add("active");
//                     // Cargar datos específicos de la sección
//                     switch(targetId) {
//                         case "citas":
//                             mostrarCitas();
//                             break;
//                         case "historias":
//                             mostrarHistoriasClinicas();
//                             break;
//                         case "cuentas":
//                             mostrarCuentas();
//                             break;
//                         case "servicios":
//                             mostrarServicios();
//                             break;
//                     }
//                 } else {
//                     seccion.classList.remove("active");
//                 }
//             });
//         });
//     });
// }

// Función para manejar el menú hamburguesa
function manejarHamburgerMenu() {
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');

    hamburgerMenu.addEventListener('click', (e) => {
        e.preventDefault();
        sidebar.classList.toggle('compressed');
        mainContent.classList.toggle('expanded');
    });
}

// Función para manejar las notificaciones
function manejarNotificaciones() {
    const notificationBell = document.querySelector('.notification-bell');
    const notificationsPanel = document.getElementById('notifications-panel');

    notificationBell.addEventListener('click', (e) => {
        e.preventDefault();
        notificationsPanel.style.display = notificationsPanel.style.display === 'block' ? 'none' : 'block';
    });

    // Cerrar el panel de notificaciones al hacer clic fuera de él
    document.addEventListener('click', (e) => {
        if (!notificationsPanel.contains(e.target) && !notificationBell.contains(e.target)) {
            notificationsPanel.style.display = 'none';
        }
    });
}

// Funciones para mostrar datos en el DOM (simuladas)
function mostrarCitas() {
    const listaCitas = document.getElementById("lista-citas");
    listaCitas.innerHTML = `

    `;
}

function mostrarHistoriasClinicas() {
    const listaHistorias = document.getElementById("lista-historias");
    listaHistorias.innerHTML = `

    `;
}

function mostrarCuentas() {
    const listaCuentas = document.getElementById("lista-cuentas");
    listaCuentas.innerHTML = `

    `;
}

function mostrarServicios() {
    const listaServicios = document.getElementById("lista-servicios");
    listaServicios.innerHTML = `
       
    `;
}

// // Funciones para manejar eventos (simuladas)
// function mostrarDetallesCita(id) {
//     alert(`Mostrando detalles de la cita con ID: ${id}`);
// }

// function verHistoriaClinica(id) {
//     alert(`Mostrando historia clínica con ID: ${id}`);
// }

// function editarCuenta(id) {
//     alert(`Editando cuenta con ID: ${id}`);
// }

// function editarServicio(id) {
//     alert(`Editando servicio con ID: ${id}`);
// }

// // Función para cerrar sesión (simulada)
// function cerrarSesion() {
//     alert("Cerrando sesión...");
//     // Aquí iría la lógica real para cerrar sesión,     como limpiar el almacenamiento local y redirigir a la página de inicio de sesión
// }



function handleMobileNavigation() {
    const mobileHamburger = document.querySelector('.mobile-nav-icons .fa-bars').parentElement;
    const mobileSidebar = document.querySelector('.mobile-sidebar');
    const mobileSidebarClose = document.querySelector('.mobile-sidebar-close');
    const mobileMenuItems = document.querySelectorAll('.mobile-sidebar .sidebar-menu a');

    mobileHamburger.addEventListener('click', (e) => {
        e.preventDefault();
        mobileSidebar.classList.add('open');
    });

    mobileSidebarClose.addEventListener('click', () => {
        mobileSidebar.classList.remove('open');
    });

    // Cerrar el sidebar móvil al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!mobileSidebar.contains(e.target) && !mobileHamburger.contains(e.target) && mobileSidebar.classList.contains('open')) {
            mobileSidebar.classList.remove('open');
        }
    });

    // Manejar clics en los elementos del menú móvil
    mobileMenuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('href').substring(1);

            // Cerrar el sidebar móvil
            mobileSidebar.classList.remove('open');

            // Manejar la acción de cerrar sesión
            if (targetId === 'cerrar-sesion') {
                cerrarSesion();
                return;
            }

            // Mostrar la sección correspondiente
            const secciones = document.querySelectorAll('.dashboard-section');
            secciones.forEach(seccion => {
                if (seccion.id === targetId) {
                    seccion.classList.add('active');
                    // Cargar datos específicos de la sección
                    switch(targetId) {
                        case "citas":
                            mostrarCitas();
                            break;
                        case "historias":
                            mostrarHistoriasClinicas();
                            break;
                        case "cuentas":
                            mostrarCuentas();
                            break;
                        case "servicios":
                            mostrarServicios();
                            break;
                    }
                } else {
                    seccion.classList.remove('active');
                }
            });

            // Actualizar el mensaje de bienvenida
            const welcomeMessage = document.getElementById('welcome-message');
            if (welcomeMessage) {
                welcomeMessage.textContent = `Sección: ${item.querySelector('span').textContent}`;
            }
        });
    });
}


function handleMobileNavigation() {
    const mobileHamburger = document.querySelector('.mobile-nav-icons .fa-bars').parentElement;
    const mobileSidebar = document.querySelector('.mobile-sidebar');
    const mobileSidebarClose = document.querySelector('.mobile-sidebar-close');
    const mobileMenuItems = document.querySelectorAll('.mobile-sidebar .sidebar-menu a');

    mobileHamburger.addEventListener('click', (e) => {
        e.preventDefault();
        mobileSidebar.classList.add('open');
    });

    mobileSidebarClose.addEventListener('click', () => {
        mobileSidebar.classList.remove('open');
    });

    // Cerrar el sidebar móvil al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!mobileSidebar.contains(e.target) && !mobileHamburger.contains(e.target) && mobileSidebar.classList.contains('open')) {
            mobileSidebar.classList.remove('open');
        }
    });

    // Manejar clics en los elementos del menú móvil
    mobileMenuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('href').substring(1);

            // Cerrar el sidebar móvil
            mobileSidebar.classList.remove('open');

            // Manejar la acción de cerrar sesión
            if (targetId === 'cerrar-sesion') {
                cerrarSesion();
                return;
            }

            // Mostrar la sección correspondiente
            const secciones = document.querySelectorAll('.dashboard-section');
            secciones.forEach(seccion => {
                if (seccion.id === targetId) {
                    seccion.classList.add('active');
                    // Cargar datos específicos de la sección
                    switch(targetId) {
                        case "citas":
                            mostrarCitas();
                            break;
                        case "historias":
                            mostrarHistoriasClinicas();
                            break;
                        case "cuentas":
                            mostrarCuentas();
                            break;
                        case "servicios":
                            mostrarServicios();
                            break;
                    }
                } else {
                    seccion.classList.remove('active');
                }
            });

            // Actualizar el mensaje de bienvenida
            const welcomeMessage = document.getElementById('welcome-message');
            if (welcomeMessage) {
                welcomeMessage.textContent = `Sección: ${item.querySelector('span').textContent}`;
            }
        });
    });
}
// Función para inicializar la aplicación
function inicializarApp() {
    handleMobileNavigation();
    // manejarNavegacion();
    manejarHamburgerMenu();
    manejarNotificaciones();
    // Mostrar la sección de calendario por defecto
    // document.getElementById("calendario").classList.add("active");
}

// Ejecutar funciones al cargar la página
window.onload = inicializarApp;
const daysContainer = document.querySelector(".days"),
nextBtn = document.querySelector(".next-btn"),
prevBtn = document.querySelector(".prev-btn"),
month = document.querySelector(".month"),
todayBtn= document.querySelector(".today-btn");


const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Setiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
];

const days = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

//get current date
const date = new Date();
//get current month
let currentMonth = date.getMonth();
//get current year
let currentYear = date.getFullYear();

//function to render days
function renderCalendar() {
    date.setDate(1);
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const lastDayIndex = lastDay.getDay();
    const lastDayDate = lastDay.getDate();
    const prevLastDay = new Date(currentYear, currentMonth, 0);
    const prevLastDayDate = prevLastDay.getDate();
    const nextDays = 7 - lastDayIndex - 1;

    month.innerHTML = `${months[currentMonth]} ${currentYear}`;
    let daysHTML = "";

    // Obtener la fecha actual para comparación
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);  // Establecer la hora a 00:00 para comparar solo las fechas

    // Días del mes anterior
    for (let x = firstDay.getDay(); x > 0; x--) {
        daysHTML += `<div class="day prev">${prevLastDayDate - x + 1}</div>`;
    }

    // Días del mes actual
    for (let i = 1; i <= lastDayDate; i++) {
        const dayDate = new Date(currentYear, currentMonth, i);
        // Comparar si el día es pasado
        const isPastDay = dayDate < currentDate;
        // Si es el día actual, marcarlo con la clase "today"
        if (
            i === new Date().getDate() &&
            currentMonth === new Date().getMonth() &&
            currentYear === new Date().getFullYear()
        ) {
            daysHTML += `<button onclick="openModalCalendario('${dayDate.toISOString()}')" class="day today" ${isPastDay ? 'disabled' : ''}>${i}</button>`;
        } else {
            daysHTML += `<button onclick="openModalCalendario('${dayDate.toISOString()}')" class="day ${isPastDay ? 'disabled' : ''}" ${isPastDay ? 'disabled' : ''}>${i}</button>`;
        }
    }
    // Días del siguiente mes
    for (let j = 1; j <= nextDays; j++) {
        daysHTML += `<div class="day next">${j}</div>`;
    }
    hideTodayBtn();
    daysContainer.innerHTML = daysHTML;
}

// Función para manejar la selección de la fecha y abrir el modal
function openModalCalendario(date) {
    const selectedDate = new Date(date);
    const currentDate = new Date();

    // Validar si la fecha seleccionada es menor que la actual
    if (selectedDate < currentDate) {
        return; // Si la fecha seleccionada es pasada, no abrir el modal
    }

    fecha = date;
    const formattedDate = `${selectedDate.getDate().toString().padStart(2, '0')}/${
        (selectedDate.getMonth() + 1).toString().padStart(2, '0')}/${selectedDate.getFullYear()}`;
    
    // Mostrar la fecha en el modal
    document.getElementById('current-date-modal').innerText = formattedDate;
    modalCalendario.classList.add('active');
}

// Llamar a la función para renderizar el calendario inicialmente
renderCalendar();

nextBtn.addEventListener("click", ()=>{
    currentMonth++;
    if(currentMonth > 11){
       currentMonth = 0;
       currentYear++;
    }
    renderCalendar();
})

prevBtn.addEventListener("click", ()=>{
    currentMonth--;
    if(currentMonth < 0){
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar();
});

todayBtn.addEventListener("click",() =>{
    currentMonth = date.getMonth();
    currentYear=date.getFullYear();

    renderCalendar();
})

function hideTodayBtn(){
    if(
        currentMonth === new Date ().getMonth()&&
        currentYear === new Date().getFullYear()
    ){
        todayBtn.style.display = "none";
    } else{
        todayBtn.style.display = "flex";
    }
}

let servicios = [
    { id: 1, nombre: "Consulta General", tipo: "Consulta", costo: 50, tiempoProcedimiento: "30 minutos", tiempoRecuperacion: "Inmediato" },
    { id: 2, nombre: "Biopsias", tipo: "Cirugía", costo: 200, tiempoProcedimiento: "30 minutos", tiempoRecuperacion: "5 días" },
   
];

// Elementos del DOM
const tablaServicios = document.getElementById('tablaServicios');
const btnAgregarServicio = document.getElementById('btnAgregarServicio');
const modal = document.getElementById('modalServicio');
const closeModal = document.querySelector('.close');
const formServicio = document.getElementById('formServicio');
const modalTitle = document.getElementById('modalTitle');
const searchInput = document.getElementById('searchInput');

// Función para renderizar la tabla de servicios
function renderizarTabla(serviciosArray) {
    if(tablaServicios){
        tablaServicios.innerHTML = '';
        serviciosArray.forEach(servicio => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${servicio.nombre}</td>
                <td>${servicio.tipo}</td>
                <td>S/. ${servicio.costo}</td>
                <td>${servicio.tiempoProcedimiento}</td>
                <td>${servicio.tiempoRecuperacion}</td>
                <td>
                    <button class="edit-button" data-id="${servicio.id}">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="delete-button" data-id="${servicio.id}">
                        <i class="fas fa-trash-alt"></i> Eliminar
                    </button>
                </td>
            `;
            tablaServicios.appendChild(row);
        });
    }
}

// Inicializar la tabla
renderizarTabla(servicios);

// Evento para abrir el modal de agregar servicio
btnAgregarServicio?.addEventListener('click', () => {
    modalTitle.textContent = 'Añadir Servicio';
    formServicio.reset();
    modal.classList.add('show');
});

// Evento para cerrar el modal
closeModal?.addEventListener('click', () => {
    modal.classList.remove('show');
});

// Evento para manejar el envío del formulario
formServicio?.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(formServicio);
    const nuevoServicio = {
        id: Date.now(), // Generar un ID único
        nombre: formData.get('nombre'),
        tipo: formData.get('tipoProcedimiento'),
        costo: parseFloat(formData.get('costo')),
        tiempoProcedimiento: formData.get('tiempoEstimadoProcedimiento'),
        tiempoRecuperacion: formData.get('tiempoEstimadoRecuperacion')
    };

    if (formServicio.dataset.editId) {
        // Editar servicio existente
        const index = servicios.findIndex(s => s.id === parseInt(formServicio.dataset.editId));
        if (index !== -1) {
            servicios[index] = { ...servicios[index], ...nuevoServicio };
        }
        delete formServicio.dataset.editId;
    } else {
        // Agregar nuevo servicio
        servicios.push(nuevoServicio);
    }

    renderizarTabla(servicios);
    modal.classList.remove('show');
});

// Evento para editar o eliminar servicios
tablaServicios?.addEventListener('click', (e) => {
    if (e.target.classList.contains('edit-button') || e.target.closest('.edit-button')) {
        const id = parseInt(e.target.dataset.id || e.target.closest('.edit-button').dataset.id);
        const servicio = servicios.find(s => s.id === id);
        if (servicio) {
            modalTitle.textContent = 'Editar Servicio';
            formServicio.nombre.value = servicio.nombre;
            formServicio.tipoProcedimiento.value = servicio.tipo;
            formServicio.costo.value = servicio.costo;
            formServicio.tiempoEstimadoProcedimiento.value = servicio.tiempoProcedimiento;
            formServicio.tiempoEstimadoRecuperacion.value = servicio.tiempoRecuperacion;
            formServicio.dataset.editId = id;
            modal.classList.add('show');
        }
    } else if (e.target.classList.contains('delete-button') || e.target.closest('.delete-button')) {
        const id = parseInt(e.target.dataset.id || e.target.closest('.delete-button').dataset.id);
        if (confirm('¿Estás seguro de que quieres eliminar este servicio?')) {
            servicios = servicios.filter(s => s.id !== id);
            renderizarTabla(servicios);
        }
    }
});

// Evento para buscar servicios
searchInput?.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const serviciosFiltrados = servicios.filter(servicio => 
        servicio.nombre.toLowerCase().includes(searchTerm) ||
        servicio.tipo.toLowerCase().includes(searchTerm)
    );
    renderizarTabla(serviciosFiltrados);
});

// Cerrar el modal si se hace clic fuera de él
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('show');
    }
});